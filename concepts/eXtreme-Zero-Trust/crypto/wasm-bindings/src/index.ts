export type CryptoHandle = number & { readonly __cryptoHandle: unique symbol }

export interface CryptoPlaneAbi {
  protocolVersion(): number
  ephemeralGenerate(agentHash: number): CryptoHandle
  sessionDerive(key: CryptoHandle, peerPublicHash: number): CryptoHandle
  dpopIssue(session: CryptoHandle, methodHash: number, uriHash: number, messageHash: number): CryptoHandle
  dpopVerify(token: CryptoHandle, sessionOk: number, messageHashOk: number, replayOk: number): CryptoHandle
  messageRelease(verified: CryptoHandle, localAppendOk: number): CryptoHandle
}

// JS/Gleam code receives opaque handles only; private key bytes remain behind
// the Rust/WASM/sidecar boundary.
