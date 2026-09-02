export type LogicalEvent<T> = Readonly<{
  messageId: string
  subject: string
  payload: T
}>

export class ReplayGuard {
  readonly #seen = new Set<string>()

  claim(messageId: string): boolean {
    if (this.#seen.has(messageId)) return false
    this.#seen.add(messageId)
    return true
  }
}

export type LocalAppendReceipt = Readonly<{
  messageId: string
  persistedAtMs: number
}>

export function ackAllowed(event: LogicalEvent<unknown>, receipt: LocalAppendReceipt): boolean {
  return event.messageId === receipt.messageId
}
