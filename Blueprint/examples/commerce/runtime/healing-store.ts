import { createHash, randomUUID } from 'node:crypto';

export type HealingCaseStatus = 'pending-human' | 'resumed' | 'expired' | 'terminal';
export interface HealingCase {
  id: string;
  intent: string;
  agent: string;
  action: string;
  original_event: string;
  original_payload: unknown;
  original_payload_hash: string;
  error_event: string;
  error_message: string;
  correlation_id: string;
  resume_token: string;
  created_at: string;
  expires_at: string;
  status: HealingCaseStatus;
  attempts: number;
}

export interface HealingAuditEntry {
  at: string;
  case_id?: string;
  kind: 'attempt' | 'retry' | 'fallback' | 'human-escalation' | 'resume' | 'terminal';
  agent: string;
  action: string;
  detail: string;
}

export class InMemoryHealingStore {
  private readonly cases = new Map<string, HealingCase>();
  private readonly audits: HealingAuditEntry[] = [];

  hash(payload: unknown): string { return createHash('sha256').update(JSON.stringify(payload ?? null)).digest('hex'); }
  audit(entry: Omit<HealingAuditEntry,'at'>): void { this.audits.push({ at: new Date().toISOString(), ...entry }); }
  auditLog(): readonly HealingAuditEntry[] { return this.audits; }
  listPending(): HealingCase[] { return [...this.cases.values()].filter(value => value.status === 'pending-human'); }
  get(caseId: string): HealingCase | undefined { return this.cases.get(caseId); }

  escalate(input: Omit<HealingCase,'id'|'resume_token'|'created_at'|'expires_at'|'status'|'attempts'|'original_payload_hash'>, ttlMs: number): HealingCase {
    const existing = [...this.cases.values()].find(value => value.correlation_id === input.correlation_id && value.action === input.action && value.status === 'pending-human');
    if (existing) return existing;
    const now = Date.now();
    const value: HealingCase = { ...input, original_payload_hash:this.hash(input.original_payload), id: randomUUID(), resume_token: randomUUID(), created_at: new Date(now).toISOString(), expires_at: new Date(now + ttlMs).toISOString(), status: 'pending-human', attempts: 0 };
    this.cases.set(value.id, value);
    this.audit({ kind:'human-escalation', case_id:value.id, agent:value.agent, action:value.action, detail:value.error_message });
    return value;
  }

  consumeResume(caseId: string, token: string): HealingCase {
    const value = this.cases.get(caseId);
    if (!value) throw new Error('Healing case not found');
    if (value.status !== 'pending-human') throw new Error('Healing case already consumed');
    if (value.resume_token !== token) throw new Error('Invalid healing resume token');
    if (Date.parse(value.expires_at) <= Date.now()) { value.status='expired'; throw new Error('Healing case expired'); }
    value.status='resumed'; value.attempts += 1;
    this.audit({ kind:'resume', case_id:value.id, agent:value.agent, action:value.action, detail:'Human context accepted for single resume.' });
    return value;
  }
}
