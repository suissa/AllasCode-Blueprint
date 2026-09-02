export type RevisionedRegister<T> = Readonly<{
  entityId: string
  revision: number
  writerRank: number
  payload: T
}>

export function merge<T>(local: RevisionedRegister<T>, incoming: RevisionedRegister<T>): RevisionedRegister<T> {
  if (local.entityId !== incoming.entityId) return local
  if (incoming.revision > local.revision) return incoming
  if (incoming.revision < local.revision) return local
  if (incoming.writerRank > local.writerRank) return incoming
  return local
}
