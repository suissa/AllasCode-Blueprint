import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, randomUUID } from 'node:crypto';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

export type PqErrorCode = 'PqKeyUnavailable' | 'PqDecapsulationFailed' | 'PqSignatureInvalid' | 'ContextBindingMismatch' | 'KeyRotationRequired';
export type PqResult<T> = { outcome: 'Ok'; value: T } | { outcome: 'Error'; code: PqErrorCode };
export type PqKeyState = 'active' | 'decrypt-only' | 'retired';

interface PqKeyRecord {
  key_id: string;
  version: number;
  state: PqKeyState;
  created_at: string;
  kem_public_key: Uint8Array;
  kem_secret_key: Uint8Array;
  dsa_public_key: Uint8Array;
  dsa_secret_key: Uint8Array;
}

/** The production implementation must persist encrypted key material and make rotation atomic. */
export interface PostQuantumKeyRepository {
  get(keyId: string, version: number): PqKeyRecord | undefined;
  getActive(keyId: string): PqKeyRecord | undefined;
  saveInitial(record: PqKeyRecord): boolean;
  commitRotation(previousVersion: number, next: PqKeyRecord): boolean;
  retire(keyId: string, version: number): PqKeyRecord | undefined;
}

/** Reference adapter. A KMS/HSM-backed adapter is required outside tests and local demos. */
export class InMemoryPostQuantumKeyRepository implements PostQuantumKeyRepository {
  private readonly keys = new Map<string, Map<number, PqKeyRecord>>();
  private readonly active = new Map<string, number>();
  get(keyId:string,version:number){return this.keys.get(keyId)?.get(version);}
  getActive(keyId:string){const version=this.active.get(keyId);return version===undefined?undefined:this.get(keyId,version);}
  saveInitial(record:PqKeyRecord){if(this.active.has(record.key_id))return false;this.keys.set(record.key_id,new Map([[record.version,record]]));this.active.set(record.key_id,record.version);return true;}
  commitRotation(previousVersion:number,next:PqKeyRecord){const previous=this.get(next.key_id,previousVersion);if(!previous||this.active.get(next.key_id)!==previousVersion)return false;this.keys.get(next.key_id)!.set(next.version,next);previous.state='decrypt-only';this.active.set(next.key_id,next.version);return true;}
  retire(keyId:string,version:number){if(this.active.get(keyId)===version)return undefined;const record=this.get(keyId,version);if(record)record.state='retired';return record;}
}

export interface PqPublicKeyDescriptor {
  key_id: string;
  version: number;
  state: PqKeyState;
  created_at: string;
  kem: 'ML-KEM-768';
  signature: 'ML-DSA-65';
  kem_public_key: string;
  dsa_public_key: string;
}

export interface PqEncryptedEnvelope {
  version: 1;
  key_id: string;
  key_version: number;
  kem: 'ML-KEM-768';
  kdf: 'HKDF-SHA-256';
  aead: 'AES-256-GCM';
  encapsulated_key: string;
  iv: string;
  ciphertext: string;
  auth_tag: string;
  context_digest: string;
}

export interface PqDetachedSignature {
  key_id: string;
  key_version: number;
  algorithm: 'ML-DSA-65';
  signature: string;
  context_digest?: string;
}

export interface PqAuditEvent {
  event: 'PQ.KeyCreated' | 'PQ.KeyRotated' | 'PQ.KeyRetired' | 'PQ.Encrypt.Ok' | 'PQ.Decrypt.Ok' | 'PQ.Decrypt.Error' | 'PQ.Sign.Ok' | 'PQ.Verify.Ok' | 'PQ.Verify.Error';
  at: string;
  key_id: string;
  key_version: number;
  context_digest?: string;
  reason?: string;
}

const b64 = (value: Uint8Array) => Buffer.from(value).toString('base64url');
const bytes = (value: string) => Buffer.from(value, 'base64url');
const contextDigest = (contextId: string) => createHash('sha256').update(contextId).digest('base64url');
const messageBytes = (message: string | Uint8Array) => typeof message === 'string' ? Buffer.from(message, 'utf8') : message;

function aad(envelope: Pick<PqEncryptedEnvelope, 'version' | 'key_id' | 'key_version' | 'kem' | 'kdf' | 'aead' | 'context_digest'>): Buffer {
  return Buffer.from(JSON.stringify(envelope), 'utf8');
}

function deriveAeadKey(sharedSecret: Uint8Array, keyId: string, keyVersion: number, digest: string): Buffer {
  const salt = Buffer.from(digest, 'base64url');
  const info = Buffer.from(`allascode:pq-envelope:v1:${keyId}:${keyVersion}`, 'utf8');
  return Buffer.from(hkdfSync('sha256', sharedSecret, salt, info, 32));
}

export class PostQuantumSecurityService {
  readonly audit: PqAuditEvent[] = [];
  constructor(private readonly keys:PostQuantumKeyRepository=new InMemoryPostQuantumKeyRepository()){}

  createKeySet(input: { now: string; key_id?: string }): PqResult<PqPublicKeyDescriptor> {
    try {
      const keyId = input.key_id ?? randomUUID();
      if (this.keys.getActive(keyId)) return { outcome: 'Error', code: 'KeyRotationRequired' };
      const record = this.generateRecord(keyId, 1, input.now);
      if(!this.keys.saveInitial(record))return { outcome: 'Error', code: 'KeyRotationRequired' };
      this.audit.push({ event: 'PQ.KeyCreated', at: input.now, key_id: keyId, key_version: 1 });
      return { outcome: 'Ok', value: this.describe(record) };
    } catch { return { outcome: 'Error', code: 'PqKeyUnavailable' }; }
  }

  rotate(input: { key_id: string; now: string }): PqResult<PqPublicKeyDescriptor> {
    const active = this.getActive(input.key_id);
    if (!active) return { outcome: 'Error', code: 'PqKeyUnavailable' };
    try {
      const version = active.version + 1;
      // Generate first; publish the new version and demote the old one as one commit.
      const next = this.generateRecord(input.key_id, version, input.now);
      if(!this.keys.commitRotation(active.version,next))return { outcome: 'Error', code: 'KeyRotationRequired' };
      this.audit.push({ event: 'PQ.KeyRotated', at: input.now, key_id: input.key_id, key_version: version });
      return { outcome: 'Ok', value: this.describe(next) };
    } catch { return { outcome: 'Error', code: 'PqKeyUnavailable' }; }
  }

  retire(input: { key_id: string; version: number; now: string }): PqResult<{ key_id: string; version: number; state: 'retired' }> {
    const activeVersion = this.keys.getActive(input.key_id)?.version;
    if (activeVersion === input.version) return { outcome: 'Error', code: 'KeyRotationRequired' };
    const record = this.keys.retire(input.key_id,input.version);
    if (!record) return { outcome: 'Error', code: 'PqKeyUnavailable' };
    this.audit.push({ event: 'PQ.KeyRetired', at: input.now, key_id: input.key_id, key_version: input.version });
    return { outcome: 'Ok', value: { key_id: input.key_id, version: input.version, state: 'retired' } };
  }

  describeKey(key_id: string, version?: number): PqResult<PqPublicKeyDescriptor> {
    const record = version === undefined ? this.getActive(key_id) : this.keys.get(key_id,version);
    return record ? { outcome: 'Ok', value: this.describe(record) } : { outcome: 'Error', code: 'PqKeyUnavailable' };
  }

  encrypt(input: { key_id: string; context_id: string; plaintext: string | Uint8Array; now: string }): PqResult<PqEncryptedEnvelope> {
    const record = this.getActive(input.key_id);
    if (!record) return { outcome: 'Error', code: 'PqKeyUnavailable' };
    let sharedSecret: Uint8Array | undefined;
    let key: Buffer | undefined;
    try {
      const encapsulated = ml_kem768.encapsulate(record.kem_public_key);
      sharedSecret = encapsulated.sharedSecret;
      const digest = contextDigest(input.context_id);
      key = deriveAeadKey(sharedSecret, record.key_id, record.version, digest);
      const iv = randomBytes(12);
      const envelopeBase = { version: 1 as const, key_id: record.key_id, key_version: record.version, kem: 'ML-KEM-768' as const, kdf: 'HKDF-SHA-256' as const, aead: 'AES-256-GCM' as const, context_digest: digest };
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(aad(envelopeBase));
      const ciphertext = Buffer.concat([cipher.update(messageBytes(input.plaintext)), cipher.final()]);
      const envelope: PqEncryptedEnvelope = { ...envelopeBase, encapsulated_key: b64(encapsulated.cipherText), iv: b64(iv), ciphertext: b64(ciphertext), auth_tag: b64(cipher.getAuthTag()) };
      this.audit.push({ event: 'PQ.Encrypt.Ok', at: input.now, key_id: record.key_id, key_version: record.version, context_digest: digest });
      return { outcome: 'Ok', value: envelope };
    } catch { return { outcome: 'Error', code: 'PqDecapsulationFailed' }; }
    finally {
      key?.fill(0);
      sharedSecret?.fill(0);
    }
  }

  decrypt(input: { envelope: PqEncryptedEnvelope; context_id: string; now: string }): PqResult<Uint8Array> {
    const record = this.keys.get(input.envelope.key_id,input.envelope.key_version);
    if (!record || record.state === 'retired') return { outcome: 'Error', code: 'PqKeyUnavailable' };
    const digest = contextDigest(input.context_id);
    if (digest !== input.envelope.context_digest) return { outcome: 'Error', code: 'ContextBindingMismatch' };
    let sharedSecret: Uint8Array | undefined;
    let key: Buffer | undefined;
    try {
      sharedSecret = ml_kem768.decapsulate(bytes(input.envelope.encapsulated_key), record.kem_secret_key);
      key = deriveAeadKey(sharedSecret, record.key_id, record.version, digest);
      const decipher = createDecipheriv('aes-256-gcm', key, bytes(input.envelope.iv));
      decipher.setAAD(aad({ version: input.envelope.version, key_id: input.envelope.key_id, key_version: input.envelope.key_version, kem: input.envelope.kem, kdf: input.envelope.kdf, aead: input.envelope.aead, context_digest: input.envelope.context_digest }));
      decipher.setAuthTag(bytes(input.envelope.auth_tag));
      const plaintext = Buffer.concat([decipher.update(bytes(input.envelope.ciphertext)), decipher.final()]);
      this.audit.push({ event: 'PQ.Decrypt.Ok', at: input.now, key_id: record.key_id, key_version: record.version, context_digest: digest });
      return { outcome: 'Ok', value: plaintext };
    } catch {
      this.audit.push({ event: 'PQ.Decrypt.Error', at: input.now, key_id: record.key_id, key_version: record.version, context_digest: digest, reason: 'PqDecapsulationFailed' });
      return { outcome: 'Error', code: 'PqDecapsulationFailed' };
    } finally {
      key?.fill(0);
      sharedSecret?.fill(0);
    }
  }

  sign(input: { key_id: string; message: string | Uint8Array; context_id?: string; now: string }): PqResult<PqDetachedSignature> {
    const record = this.getActive(input.key_id);
    if (!record) return { outcome: 'Error', code: 'PqKeyUnavailable' };
    try {
    const ctx = input.context_id ? Buffer.from(input.context_id, 'utf8') : undefined;
    const signature = ctx ? ml_dsa65.sign(messageBytes(input.message), record.dsa_secret_key, { context: ctx }) : ml_dsa65.sign(messageBytes(input.message), record.dsa_secret_key);
    const result: PqDetachedSignature = { key_id: record.key_id, key_version: record.version, algorithm: 'ML-DSA-65', signature: b64(signature), ...(input.context_id ? { context_digest: contextDigest(input.context_id) } : {}) };
    this.audit.push({
      event: 'PQ.Sign.Ok',
      at: input.now,
      key_id: record.key_id,
      key_version: record.version,
      ...(result.context_digest !== undefined ? { context_digest: result.context_digest } : {}),
    });
    return { outcome: 'Ok', value: result };
    } catch { return { outcome: 'Error', code: 'PqSignatureInvalid' }; }
  }

  verify(input: { signature: PqDetachedSignature; message: string | Uint8Array; context_id?: string; now: string }): PqResult<{ valid: true }> {
    const record = this.keys.get(input.signature.key_id,input.signature.key_version);
    if (!record) return { outcome: 'Error', code: 'PqKeyUnavailable' };
    const expectedDigest = input.context_id ? contextDigest(input.context_id) : undefined;
    if (expectedDigest !== input.signature.context_digest) return { outcome: 'Error', code: 'ContextBindingMismatch' };
    try {
      const ctx = input.context_id ? Buffer.from(input.context_id, 'utf8') : undefined;
      const valid = ctx
        ? ml_dsa65.verify(bytes(input.signature.signature), messageBytes(input.message), record.dsa_public_key, { context: ctx })
        : ml_dsa65.verify(bytes(input.signature.signature), messageBytes(input.message), record.dsa_public_key);
      if (!valid) throw new Error('InvalidSignature');
      this.audit.push({
        event: 'PQ.Verify.Ok',
        at: input.now,
        key_id: record.key_id,
        key_version: record.version,
        ...(expectedDigest !== undefined ? { context_digest: expectedDigest } : {}),
      });
      return { outcome: 'Ok', value: { valid: true } };
    } catch {
      this.audit.push({
        event: 'PQ.Verify.Error',
        at: input.now,
        key_id: record.key_id,
        key_version: record.version,
        reason: 'PqSignatureInvalid',
        ...(expectedDigest !== undefined ? { context_digest: expectedDigest } : {}),
      });
      return { outcome: 'Error', code: 'PqSignatureInvalid' };
    }
  }

  private generateRecord(key_id: string, version: number, now: string): PqKeyRecord {
    const kem = ml_kem768.keygen();
    const dsa = ml_dsa65.keygen();
    return { key_id, version, state: 'active', created_at: now, kem_public_key: kem.publicKey, kem_secret_key: kem.secretKey, dsa_public_key: dsa.publicKey, dsa_secret_key: dsa.secretKey };
  }

  private getActive(key_id: string): PqKeyRecord | undefined {
    return this.keys.getActive(key_id);
  }

  private describe(record: PqKeyRecord): PqPublicKeyDescriptor {
    return { key_id: record.key_id, version: record.version, state: record.state, created_at: record.created_at, kem: 'ML-KEM-768', signature: 'ML-DSA-65', kem_public_key: b64(record.kem_public_key), dsa_public_key: b64(record.dsa_public_key) };
  }
}
