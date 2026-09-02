import type { AonMessage } from './aon-message.js'

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

export function validateEnvelope(message: AonMessage, nowMs: number, maxAgeMs: number): ValidationResult {
  if (message.version !== 1) return { ok: false, reason: 'unsupported version' }
  if (!message.messageId || !message.issuer || !message.audience) return { ok: false, reason: 'missing identity binding' }
  if (nowMs < message.issuedAtMs || nowMs - message.issuedAtMs > maxAgeMs) return { ok: false, reason: 'stale proof' }
  return { ok: true }
}
