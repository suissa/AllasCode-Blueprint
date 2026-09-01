import test from 'node:test';
import assert from 'node:assert/strict';
import { createDpopProof, DpopSecurityService, generateDpopClientKeyPair } from '../security/dpop.js';
import { PostQuantumSecurityService, type PqEncryptedEnvelope } from '../security/post-quantum.js';

const now = '2026-09-01T18:00:00.000Z';
const url = 'https://api.example.test/v1/sales?expand=items#ignored';

function expectOk<T>(result: { outcome: 'Ok'; value: T } | { outcome: 'Error'; code: string }): T {
  if (result.outcome === 'Error') throw new Error(result.code);
  return result.value;
}

function dpopFixture() {
  const key = generateDpopClientKeyPair();
  const service = new DpopSecurityService();
  const issued = expectOk(service.issueBoundAccessToken({ public_jwk: key.public_jwk, principal_id: 'operator-1', context_id: 'store-a', capabilities: ['sales.read'], ttl_ms: 60_000, now }));
  return { key, service, token: issued.access_token };
}

function proofFor(fixture: ReturnType<typeof dpopFixture>, overrides: Partial<{ method: string; url: string; now: string; access_token: string; nonce: string; jti: string }> = {}) {
  return createDpopProof({
    private_key: fixture.key.private_key,
    public_jwk: fixture.key.public_jwk,
    method: overrides.method ?? 'GET',
    url: overrides.url ?? url,
    now: overrides.now ?? now,
    access_token: overrides.access_token ?? fixture.token,
    ...(overrides.nonce !== undefined ? { nonce: overrides.nonce } : {}),
    ...(overrides.jti !== undefined ? { jti: overrides.jti } : {}),
  });
}

test('DPoP binds access token to proof key, request target, context and capability', () => {
  const f = dpopFixture();
  const proof = proofFor(f);
  const result = f.service.verifyProtectedRequest({ access_token: f.token, proof, method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now });
  assert.equal(result.outcome, 'Ok');
  const replay = f.service.verifyProtectedRequest({ access_token: f.token, proof, method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now });
  assert.deepEqual(replay, { outcome: 'Error', code: 'DpopReplayDetected' });
});

test('DPoP rejects method, URI, age and ath mismatches', () => {
  const method = dpopFixture();
  assert.deepEqual(method.service.verifyProtectedRequest({ access_token: method.token, proof: proofFor(method, { method: 'POST' }), method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now }), { outcome: 'Error', code: 'DpopHtmMismatch' });
  const uri = dpopFixture();
  assert.deepEqual(uri.service.verifyProtectedRequest({ access_token: uri.token, proof: proofFor(uri, { url: 'https://api.example.test/v1/other' }), method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now }), { outcome: 'Error', code: 'DpopHtuMismatch' });
  const stale = dpopFixture();
  assert.deepEqual(stale.service.verifyProtectedRequest({ access_token: stale.token, proof: proofFor(stale, { now: '2026-09-01T17:50:00.000Z' }), method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now }), { outcome: 'Error', code: 'DpopIatOutsideWindow' });
  const ath = dpopFixture();
  assert.deepEqual(ath.service.verifyProtectedRequest({ access_token: ath.token, proof: proofFor(ath, { access_token: 'different-token' }), method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now }), { outcome: 'Error', code: 'DpopAthMismatch' });
});

test('DPoP nonce, key thumbprint and authorization boundaries are explicit', () => {
  const nonce = dpopFixture();
  assert.deepEqual(nonce.service.verifyProtectedRequest({ access_token: nonce.token, proof: proofFor(nonce), method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now, expected_nonce: 'server-nonce' }), { outcome: 'Error', code: 'DpopNonceRequired' });
  const otherKey = generateDpopClientKeyPair();
  const mismatch = dpopFixture();
  const mismatchProof = createDpopProof({ private_key: otherKey.private_key, public_jwk: otherKey.public_jwk, method: 'GET', url, now, access_token: mismatch.token });
  assert.deepEqual(mismatch.service.verifyProtectedRequest({ access_token: mismatch.token, proof: mismatchProof, method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now }), { outcome: 'Error', code: 'DpopThumbprintMismatch' });
  const context = dpopFixture();
  assert.deepEqual(context.service.verifyProtectedRequest({ access_token: context.token, proof: proofFor(context), method: 'GET', url, context_id: 'store-b', capability: 'sales.read', now }), { outcome: 'Error', code: 'CrossContextDenied' });
  const capability = dpopFixture();
  assert.deepEqual(capability.service.verifyProtectedRequest({ access_token: capability.token, proof: proofFor(capability), method: 'GET', url, context_id: 'store-a', capability: 'settings.manage', now }), { outcome: 'Error', code: 'CapabilityDenied' });
});

test('DPoP audit never stores raw access token or proof JWT', () => {
  const f = dpopFixture();
  const proof = proofFor(f);
  f.service.verifyProtectedRequest({ access_token: f.token, proof, method: 'GET', url, context_id: 'store-a', capability: 'sales.read', now });
  const audit = JSON.stringify(f.service.audit);
  assert.equal(audit.includes(f.token), false);
  assert.equal(audit.includes(proof), false);
  assert.ok(f.service.audit.every(event => 'token_digest' in event));
});

test('ML-KEM-768 + HKDF + AES-256-GCM round trips with context binding', () => {
  const pq = new PostQuantumSecurityService();
  expectOk(pq.createKeySet({ now, key_id: 'commerce-root' }));
  const encrypted = expectOk(pq.encrypt({ key_id: 'commerce-root', context_id: 'store-a', plaintext: 'sensitive commercial payload', now }));
  const decrypted = expectOk(pq.decrypt({ envelope: encrypted, context_id: 'store-a', now }));
  assert.equal(Buffer.from(decrypted).toString('utf8'), 'sensitive commercial payload');
  assert.deepEqual(pq.decrypt({ envelope: encrypted, context_id: 'store-b', now }), { outcome: 'Error', code: 'ContextBindingMismatch' });
});

test('tampered PQ envelope is rejected by authenticated decryption', () => {
  const pq = new PostQuantumSecurityService();
  expectOk(pq.createKeySet({ now, key_id: 'commerce-root' }));
  const encrypted = expectOk(pq.encrypt({ key_id: 'commerce-root', context_id: 'store-a', plaintext: 'payload', now }));
  const raw = Buffer.from(encrypted.ciphertext, 'base64url');
  raw[0] = (raw[0] ?? 0) ^ 1;
  const tampered: PqEncryptedEnvelope = { ...encrypted, ciphertext: raw.toString('base64url') };
  assert.deepEqual(pq.decrypt({ envelope: tampered, context_id: 'store-a', now }), { outcome: 'Error', code: 'PqDecapsulationFailed' });
});

test('ML-DSA-65 signs, verifies and rejects tampering', () => {
  const pq = new PostQuantumSecurityService();
  expectOk(pq.createKeySet({ now, key_id: 'signing-root' }));
  const signed = expectOk(pq.sign({ key_id: 'signing-root', message: 'sale:123', context_id: 'store-a', now }));
  assert.deepEqual(pq.verify({ signature: signed, message: 'sale:123', context_id: 'store-a', now }), { outcome: 'Ok', value: { valid: true } });
  assert.deepEqual(pq.verify({ signature: signed, message: 'sale:124', context_id: 'store-a', now }), { outcome: 'Error', code: 'PqSignatureInvalid' });
});

test('PQ key rotation keeps old envelopes decryptable until explicit retirement and exposes no private material', () => {
  const pq = new PostQuantumSecurityService();
  const created = expectOk(pq.createKeySet({ now, key_id: 'rotating' }));
  const oldEnvelope = expectOk(pq.encrypt({ key_id: 'rotating', context_id: 'store-a', plaintext: 'before-rotation', now }));
  const rotated = expectOk(pq.rotate({ key_id: 'rotating', now: '2026-09-01T18:01:00.000Z' }));
  assert.equal(rotated.version, 2);
  assert.equal(pq.describeKey('rotating', 1).outcome, 'Ok');
  assert.equal(pq.decrypt({ envelope: oldEnvelope, context_id: 'store-a', now }).outcome, 'Ok');
  const publicView = JSON.stringify([created, rotated, pq.audit]);
  assert.equal(publicView.includes('secret_key'), false);
  assert.equal(publicView.includes('private'), false);
  assert.equal(pq.retire({ key_id: 'rotating', version: 1, now: '2026-09-01T18:02:00.000Z' }).outcome, 'Ok');
  assert.deepEqual(pq.decrypt({ envelope: oldEnvelope, context_id: 'store-a', now }), { outcome: 'Error', code: 'PqKeyUnavailable' });
});
