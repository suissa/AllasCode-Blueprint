export type Snapshot<T> = Readonly<{
  entityId: string
  revision: number
  state: T
  createdAtMs: number
}>

export function shouldSnapshot(revision: number, every: number): boolean {
  return every > 0 && revision > 0 && revision % every === 0
}
