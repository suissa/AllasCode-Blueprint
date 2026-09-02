export type LocalAppendReceipt = Readonly<{
  agentId: string
  messageId: string
  revision: number
  persistedAtMs: number
  durable: boolean
}>

export function canAcknowledge(receipt: LocalAppendReceipt): boolean {
  return receipt.durable === true
}
