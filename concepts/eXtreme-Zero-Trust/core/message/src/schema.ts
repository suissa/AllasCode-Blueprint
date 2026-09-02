export const AON_ATCP_VERSION = 1 as const

export const FIELD = Object.freeze({
  version: 1,
  messageId: 2,
  issuer: 3,
  audience: 4,
  sessionId: 5,
  nonce: 6,
  intent: 7,
  issuedAtMs: 8,
  payloadHash: 9,
  payload: 10,
})
