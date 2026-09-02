export type SessionBinding = Readonly<{
  sessionId: string
  localIdentity: string
  peerIdentity: string
  negotiatedSuite: string
  createdAtMs: number
}>

export function sameSession(a: SessionBinding, sessionId: string, peerIdentity: string): boolean {
  return a.sessionId === sessionId && a.peerIdentity === peerIdentity
}
