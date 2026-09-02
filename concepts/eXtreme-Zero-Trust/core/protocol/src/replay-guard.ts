export interface ReplayStore {
  has(key: string): Promise<boolean>
  put(key: string, expiresAtMs: number): Promise<void>
}

export async function claimReplayKey(store: ReplayStore, key: string, expiresAtMs: number): Promise<boolean> {
  if (await store.has(key)) return false
  await store.put(key, expiresAtMs)
  return true
}

// A production implementation must make the check+put operation atomic or
// use a datastore primitive that provides SET-if-absent semantics.
