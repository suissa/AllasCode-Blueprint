export type IntentEvent<T> = Readonly<{
  messageId: string
  intent: string
  audience: string
  payload: T
}>

export interface ExtremeZeroTrustClient {
  publish<T>(event: IntentEvent<T>): Promise<{ accepted: boolean; messageId: string }>
}

export function defineEvent<T>(event: IntentEvent<T>): IntentEvent<T> {
  return Object.freeze(event)
}
