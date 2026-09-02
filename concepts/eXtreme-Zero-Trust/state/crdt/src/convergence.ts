export type ConvergenceCertificate = Readonly<{
  entityId: string
  revision: number
  agents: readonly string[]
  status: 'converged'
}>

export function certify(entityId: string, revision: number, required: readonly string[], confirmed: ReadonlySet<string>): ConvergenceCertificate | undefined {
  if (required.some((agent) => !confirmed.has(agent))) return undefined
  return { entityId, revision, agents: [...required].sort(), status: 'converged' }
}
