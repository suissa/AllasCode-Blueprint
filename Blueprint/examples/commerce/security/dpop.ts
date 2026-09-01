import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  randomUUID,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyObject,
} from 'node:crypto';

export type DpopErrorCode =
  | 'InvalidDpopProof'
  | 'UnsupportedDpopAlgorithm'
  | 'DpopHtmMismatch'
  | 'DpopHtuMismatch'
  | 'DpopIatOutsideWindow'
  | 'DpopAthMismatch'
  | 'DpopNonceRequired'
  | 'DpopNonceMismatch'
  | 'DpopThumbprintMismatch'
  | 'DpopReplayDetected'
  | 'AccessTokenInactive'
  | 'CrossContextDenied'
  | 'CapabilityDenied';

export type DpopPublicJwk = Record<string, unknown>;
export type DpopResult<T> = { outcome: 'Ok'; value: T } | { outcome: 'Error'; code: DpopErrorCode };

const encode = (value: Uint8Array | string) => Buffer.from(value).toString('base64url');
const json = (value: unknown) => encode(JSON.stringify(value));
const sha256 = (value: Uint8Array | string) => createHash('sha256').update(value).digest();
const digestToken = (token: string) => encode(sha256(token));
export const accessTokenHash = (token: string) => encode(sha256(Buffer.from(token, 'ascii')));

function decodeJson(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as Record<string, unknown>;
}

function publicEcJwk(jwk: DpopPublicJwk): { crv: string; kty: string; x: string; y: string } {
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || typeof jwk.x !== 'string' || typeof jwk.y !== 'string') {
    throw new Error('UnsupportedDpopJwk');
  }
  if ('d' in jwk) throw new Error('PrivateDpopJwkRejected');
  return { crv: 'P-256', kty: 'EC', x: jwk.x, y: jwk.y };
}

export function calculateJwkThumbprint(jwk: DpopPublicJwk): string {
  return encode(sha256(JSON.stringify(publicEcJwk(jwk))));
}

export function normalizeDpopHtu(uri: string): string {
  const url = new URL(uri);
  url.search = '';
  url.hash = '';
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  return url.toString();
}

export interface DpopClientKeyPair {
  private_key: KeyObject;
  public_jwk: DpopPublicJwk;
  jkt: string;
}

export function generateDpopClientKeyPair(): DpopClientKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const public_jwk = publicKey.export({ format: 'jwk' }) as DpopPublicJwk;
  return { private_key: privateKey, public_jwk, jkt: calculateJwkThumbprint(public_jwk) };
}

export function createDpopProof(input: {
  private_key: KeyObject;
  public_jwk: DpopPublicJwk;
  method: string;
  url: string;
  now: string;
  jti?: string;
  access_token?: string;
  nonce?: string;
}): string {
  const header = { typ: 'dpop+jwt', alg: 'ES256', jwk: publicEcJwk(input.public_jwk) };
  const payload: Record<string, unknown> = {
    jti: input.jti ?? randomUUID(),
    htm: input.method,
    htu: normalizeDpopHtu(input.url),
    iat: Math.floor(new Date(input.now).getTime() / 1000),
  };
  if (input.access_token) payload.ath = accessTokenHash(input.access_token);
  if (input.nonce) payload.nonce = input.nonce;
  const signingInput = `${json(header)}.${json(payload)}`;
  const signature = cryptoSign('sha256', Buffer.from(signingInput), {
    key: input.private_key,
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${encode(signature)}`;
}

export class DpopReplayStore {
  private readonly seen = new Map<string, number>();

  accept(key: string, nowMs: number, ttlMs: number): boolean {
    for (const [candidate, expiresAt] of this.seen) if (expiresAt < nowMs) this.seen.delete(candidate);
    const current = this.seen.get(key);
    if (current !== undefined && current >= nowMs) return false;
    this.seen.set(key, nowMs + ttlMs);
    return true;
  }
}

export interface DpopVerifierOptions {
  max_age_seconds?: number;
  clock_skew_seconds?: number;
  replay_store?: DpopReplayStore;
}

export class DpopVerifier {
  private readonly maxAgeSeconds: number;
  private readonly clockSkewSeconds: number;
  private readonly replayStore: DpopReplayStore;

  constructor(options: DpopVerifierOptions = {}) {
    this.maxAgeSeconds = options.max_age_seconds ?? 300;
    this.clockSkewSeconds = options.clock_skew_seconds ?? 5;
    this.replayStore = options.replay_store ?? new DpopReplayStore();
  }

  verify(input: {
    proof: string;
    method: string;
    url: string;
    now: string;
    access_token?: string;
    expected_jkt?: string;
    expected_nonce?: string;
  }): DpopResult<{ jti: string; jkt: string; iat: number }> {
    try {
      const segments = input.proof.split('.');
      if (segments.length !== 3) return { outcome: 'Error', code: 'InvalidDpopProof' };
      const [protectedSegment, payloadSegment, signatureSegment] = segments;
      const header = decodeJson(protectedSegment);
      const payload = decodeJson(payloadSegment);
      if (header.typ !== 'dpop+jwt') return { outcome: 'Error', code: 'InvalidDpopProof' };
      if (header.alg !== 'ES256') return { outcome: 'Error', code: 'UnsupportedDpopAlgorithm' };
      if (!header.jwk || typeof header.jwk !== 'object' || Array.isArray(header.jwk)) return { outcome: 'Error', code: 'InvalidDpopProof' };
      const jwk = publicEcJwk(header.jwk as DpopPublicJwk);
      const publicKey = createPublicKey({ key: jwk as never, format: 'jwk' });
      const signatureValid = cryptoVerify(
        'sha256',
        Buffer.from(`${protectedSegment}.${payloadSegment}`),
        { key: publicKey, dsaEncoding: 'ieee-p1363' },
        Buffer.from(signatureSegment, 'base64url'),
      );
      if (!signatureValid) return { outcome: 'Error', code: 'InvalidDpopProof' };
      if (typeof payload.jti !== 'string' || payload.jti.length < 8 || typeof payload.htm !== 'string' || typeof payload.htu !== 'string' || typeof payload.iat !== 'number') {
        return { outcome: 'Error', code: 'InvalidDpopProof' };
      }
      if (payload.htm !== input.method) return { outcome: 'Error', code: 'DpopHtmMismatch' };
      const claimed = new URL(payload.htu);
      if (claimed.search || claimed.hash || normalizeDpopHtu(payload.htu) !== normalizeDpopHtu(input.url)) return { outcome: 'Error', code: 'DpopHtuMismatch' };
      const nowSeconds = Math.floor(new Date(input.now).getTime() / 1000);
      if (payload.iat < nowSeconds - this.maxAgeSeconds || payload.iat > nowSeconds + this.clockSkewSeconds) return { outcome: 'Error', code: 'DpopIatOutsideWindow' };
      if (input.expected_nonce !== undefined) {
        if (typeof payload.nonce !== 'string') return { outcome: 'Error', code: 'DpopNonceRequired' };
        if (payload.nonce !== input.expected_nonce) return { outcome: 'Error', code: 'DpopNonceMismatch' };
      }
      if (input.access_token !== undefined) {
        if (typeof payload.ath !== 'string' || payload.ath !== accessTokenHash(input.access_token)) return { outcome: 'Error', code: 'DpopAthMismatch' };
      }
      const jkt = calculateJwkThumbprint(jwk);
      if (input.expected_jkt !== undefined && jkt !== input.expected_jkt) return { outcome: 'Error', code: 'DpopThumbprintMismatch' };
      const replayKey = `${jkt}:${payload.jti}`;
      if (!this.replayStore.accept(replayKey, new Date(input.now).getTime(), (this.maxAgeSeconds + this.clockSkewSeconds) * 1000)) return { outcome: 'Error', code: 'DpopReplayDetected' };
      return { outcome: 'Ok', value: { jti: payload.jti, jkt, iat: payload.iat } };
    } catch {
      return { outcome: 'Error', code: 'InvalidDpopProof' };
    }
  }
}

interface BoundTokenRecord {
  token: string;
  token_digest: string;
  jkt: string;
  principal_id: string;
  context_id: string;
  capabilities: string[];
  issued_at: string;
  expires_at: string;
}

export interface DpopAuditEvent {
  event: 'DPoP.TokenIssued' | 'DPoP.Authorization.Ok' | 'DPoP.Authorization.Error';
  at: string;
  token_digest: string;
  principal_id: string;
  context_id: string;
  capability?: string;
  jkt?: string;
  proof_jti?: string;
  reason?: string;
}

export class DpopSecurityService {
  private readonly tokens = new Map<string, BoundTokenRecord>();
  readonly audit: DpopAuditEvent[] = [];

  constructor(private readonly verifier = new DpopVerifier()) {}

  issueBoundAccessToken(input: {
    public_jwk: DpopPublicJwk;
    principal_id: string;
    context_id: string;
    capabilities: string[];
    ttl_ms: number;
    now: string;
  }): DpopResult<{ access_token: string; token_type: 'DPoP'; expires_in: number; cnf: { jkt: string } }> {
    try {
      const jkt = calculateJwkThumbprint(input.public_jwk);
      const token = randomBytes(32).toString('base64url');
      const record: BoundTokenRecord = {
        token,
        token_digest: digestToken(token),
        jkt,
        principal_id: input.principal_id,
        context_id: input.context_id,
        capabilities: [...new Set(input.capabilities)],
        issued_at: input.now,
        expires_at: new Date(new Date(input.now).getTime() + input.ttl_ms).toISOString(),
      };
      this.tokens.set(token, record);
      this.audit.push({ event: 'DPoP.TokenIssued', at: input.now, token_digest: record.token_digest, principal_id: record.principal_id, context_id: record.context_id, jkt });
      return { outcome: 'Ok', value: { access_token: token, token_type: 'DPoP', expires_in: Math.max(0, Math.floor(input.ttl_ms / 1000)), cnf: { jkt } } };
    } catch {
      return { outcome: 'Error', code: 'InvalidDpopProof' };
    }
  }

  verifyProtectedRequest(input: {
    access_token: string;
    proof: string;
    method: string;
    url: string;
    context_id: string;
    capability: string;
    now: string;
    expected_nonce?: string;
  }): DpopResult<{ principal_id: string; context_id: string; capability: string; jkt: string; proof_jti: string }> {
    const record = this.tokens.get(input.access_token);
    const tokenDigest = digestToken(input.access_token);
    if (!record || new Date(input.now).getTime() >= new Date(record.expires_at).getTime()) return this.deny(input, tokenDigest, record, 'AccessTokenInactive');
    if (record.context_id !== input.context_id) return this.deny(input, tokenDigest, record, 'CrossContextDenied');
    if (!(record.capabilities.includes('*') || record.capabilities.includes(input.capability))) return this.deny(input, tokenDigest, record, 'CapabilityDenied');
    const proofResult = this.verifier.verify({ proof: input.proof, method: input.method, url: input.url, now: input.now, access_token: input.access_token, expected_jkt: record.jkt, expected_nonce: input.expected_nonce });
    if (proofResult.outcome === 'Error') return this.deny(input, tokenDigest, record, proofResult.code);
    this.audit.push({ event: 'DPoP.Authorization.Ok', at: input.now, token_digest: record.token_digest, principal_id: record.principal_id, context_id: record.context_id, capability: input.capability, jkt: proofResult.value.jkt, proof_jti: proofResult.value.jti });
    return { outcome: 'Ok', value: { principal_id: record.principal_id, context_id: record.context_id, capability: input.capability, jkt: proofResult.value.jkt, proof_jti: proofResult.value.jti } };
  }

  private deny(input: { capability: string; context_id: string; now: string }, tokenDigest: string, record: BoundTokenRecord | undefined, code: DpopErrorCode): DpopResult<never> {
    this.audit.push({ event: 'DPoP.Authorization.Error', at: input.now, token_digest: tokenDigest, principal_id: record?.principal_id ?? 'unknown', context_id: input.context_id, capability: input.capability, jkt: record?.jkt, reason: code });
    return { outcome: 'Error', code };
  }
}
