import { createHash } from 'node:crypto'

export function causalHash(parentHashes: readonly string[], payloadHash: string): string {
  const parents = [...parentHashes].sort().join('|')
  return createHash('sha256').update(`${parents}|${payloadHash}`).digest('hex')
}
