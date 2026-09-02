export type VectorClock = Readonly<Record<string, number>>

export function mergeClock(a: VectorClock, b: VectorClock): VectorClock {
  const result: Record<string, number> = { ...a }
  for (const [node, counter] of Object.entries(b)) result[node] = Math.max(result[node] ?? 0, counter)
  return Object.freeze(result)
}
