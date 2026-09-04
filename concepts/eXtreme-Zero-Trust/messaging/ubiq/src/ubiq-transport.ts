export type UbiQProtocol = 'quic' | 'nats' | 'grpc' | 'websocket'

export type LogicalEvent<T> = Readonly<{
  messageId: string
  entityId: string
  subject: string
  payload: T
  jti: string
  sessionId: string
}>

export type UbiQConfig = Readonly<{
  protocols: {
    default: readonly ['quic', 'nats']
    optional: readonly ['grpc', 'websocket']
  }
  security: {
    mtls: 'required'
    dpop: 'optional-configurable'
    zeroTrust: 'required'
  }
  consumption: {
    default: readonly ['LinearConsumeOnce', 'ZeroTrust']
    variants: readonly ['LinearConsumeAll', 'LinearConsumeAllZeroTrust']
  }
  retryWindowMs: number
  outboxAggregationMs: number
  tgcWindowMs: readonly [number, number]
}>

export const DEFAULT_UBIQ_CONFIG: UbiQConfig = {
  protocols: {
    default: ['quic', 'nats'],
    optional: ['grpc', 'websocket'],
  },
  security: {
    mtls: 'required',
    dpop: 'optional-configurable',
    zeroTrust: 'required',
  },
  consumption: {
    default: ['LinearConsumeOnce', 'ZeroTrust'],
    variants: ['LinearConsumeAll', 'LinearConsumeAllZeroTrust'],
  },
  retryWindowMs: 60_000,
  outboxAggregationMs: 60_000,
  tgcWindowMs: [20_000, 30_000],
}

export class FirstWriterReplayGuard {
  readonly #seen = new Set<string>()

  claim(event: Pick<LogicalEvent<unknown>, 'messageId' | 'jti' | 'sessionId'>): boolean {
    const key = `${event.sessionId}:${event.jti}:${event.messageId}`
    if (this.#seen.has(key)) return false
    this.#seen.add(key)
    return true
  }
}

export type LocalAppendReceipt = Readonly<{
  messageId: string
  entityId: string
  persistedAtMs: number
}>

export function ackAllowed(event: LogicalEvent<unknown>, receipt: LocalAppendReceipt): boolean {
  return event.messageId === receipt.messageId && event.entityId === receipt.entityId
}
