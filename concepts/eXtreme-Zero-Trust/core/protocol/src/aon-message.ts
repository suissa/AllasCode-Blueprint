export type AonMessage<T = Record<string, unknown>> = Readonly<{
  version: 1
  messageId: string
  issuer: string
  audience: string
  sessionId: string
  nonce: string
  intent: string
  issuedAtMs: number
  payloadHash: string
  payload: T
}>
