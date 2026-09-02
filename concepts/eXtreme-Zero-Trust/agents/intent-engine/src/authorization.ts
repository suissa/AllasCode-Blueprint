export type IntentContext = Readonly<{
  issuer: string
  audience: string
  intent: string
  capabilities: readonly string[]
}>

export type IntentPolicy = (context: IntentContext) => boolean

export function authorize(context: IntentContext, policies: readonly IntentPolicy[]): boolean {
  return policies.every((policy) => policy(context))
}
