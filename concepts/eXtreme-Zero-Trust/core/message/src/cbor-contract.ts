import { FIELD } from './schema.js'

export type CborMap = Map<number, unknown>

export function toCanonicalFieldMap(message: {
  version: number; messageId: string; issuer: string; audience: string;
  sessionId: string; nonce: string; intent: string; issuedAtMs: number;
  payloadHash: string; payload: unknown
}): CborMap {
  return new Map([
    [FIELD.version, message.version],
    [FIELD.messageId, message.messageId],
    [FIELD.issuer, message.issuer],
    [FIELD.audience, message.audience],
    [FIELD.sessionId, message.sessionId],
    [FIELD.nonce, message.nonce],
    [FIELD.intent, message.intent],
    [FIELD.issuedAtMs, message.issuedAtMs],
    [FIELD.payloadHash, message.payloadHash],
    [FIELD.payload, message.payload],
  ])
}

// Encoding bytes is delegated to a deterministic CBOR implementation selected
// by the SDK. Test vectors must pin exact bytes before interoperability claims.
