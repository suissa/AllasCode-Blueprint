import { createHash, randomUUID } from 'node:crypto';
import { ObservabilityRuntime, type TraceContext } from './observability.js';

export interface PersistentStoreSnapshot {
  store: string;
  version: number;
  records: unknown[];
  event_ids: string[];
  idempotency_keys: string[];
}

export interface BackupBundle {
  backup_id: string;
  created_at: string;
  schema_version: 1;
  stores: PersistentStoreSnapshot[];
  checksum: string;
}

export interface RestoreTarget {
  write(store: string, records: unknown[]): Promise<void> | void;
  registerEventIds(ids: string[]): Promise<void> | void;
  registerIdempotencyKeys(keys: string[]): Promise<void> | void;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}

function hashStores(stores: PersistentStoreSnapshot[]): string {
  return createHash('sha256').update(canonical(stores)).digest('hex');
}

export class DisasterRecoveryRuntime {
  constructor(private readonly observability: ObservabilityRuntime) {}

  createBackup(stores: PersistentStoreSnapshot[], ctx: TraceContext): BackupBundle {
    try {
      const normalized = stores.map(s => ({...s,event_ids:[...s.event_ids],idempotency_keys:[...s.idempotency_keys]}));
      const bundle: BackupBundle = {backup_id:randomUUID(),created_at:new Date().toISOString(),schema_version:1,stores:normalized,checksum:hashStores(normalized)};
      this.observability.trace(ctx,'provider','Backup','Ok',{backup_id:bundle.backup_id,stores:stores.map(s=>s.store)});
      return bundle;
    } catch (error) {
      this.observability.trace(ctx,'provider','Backup','Error',{error:String(error)});
      this.observability.increment('backup.failure');
      throw error;
    }
  }

  verify(bundle: BackupBundle): void {
    if (bundle.schema_version !== 1) throw new Error('UnsupportedBackupSchema');
    if (hashStores(bundle.stores) !== bundle.checksum) throw new Error('BackupChecksumMismatch');
    for (const store of bundle.stores) {
      if (new Set(store.event_ids).size !== store.event_ids.length) throw new Error(`DuplicateEventId:${store.store}`);
      if (new Set(store.idempotency_keys).size !== store.idempotency_keys.length) throw new Error(`DuplicateIdempotencyKey:${store.store}`);
    }
  }

  async restore(bundle: BackupBundle, target: RestoreTarget, ctx: TraceContext): Promise<void> {
    this.verify(bundle);
    for (const store of bundle.stores) {
      await target.write(store.store, store.records);
      await target.registerEventIds(store.event_ids);
      await target.registerIdempotencyKeys(store.idempotency_keys);
    }
    this.observability.trace(ctx,'provider','Restore','Ok',{backup_id:bundle.backup_id,stores:bundle.stores.map(s=>s.store)});
  }

  async rehearse(bundle: BackupBundle, target: RestoreTarget, ctx: TraceContext): Promise<{status:'Ok';backup_id:string}> {
    await this.restore(bundle,target,ctx);
    this.observability.trace(ctx,'provider','DisasterRecoveryRehearsal','Ok',{backup_id:bundle.backup_id});
    return {status:'Ok',backup_id:bundle.backup_id};
  }
}
