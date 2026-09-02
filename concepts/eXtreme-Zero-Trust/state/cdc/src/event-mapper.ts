export type ConfirmedChange<T> = Readonly<{
  entityId: string
  revision: number
  writerRank: number
  payloadHash: string
  payload: T
  occurredAtMs: number
}>

export function subjectFor(entityType: string): string {
  return `entity.${entityType}.changed`
}
