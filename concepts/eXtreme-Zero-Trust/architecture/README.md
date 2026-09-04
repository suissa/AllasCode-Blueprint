# Architecture

LEDSA separates correctness into orthogonal enforcement planes instead of assuming a single technology can guarantee distributed linearity.

```text
Human
  -> WebAuthn
Client Agent
  -> DPoP proof
Client Sidecar [Rust]
  -> mTLS + hybrid PQ provider
UbiQ Transport
  -> QUIC-first delivery
  -> ACK + first-writer + dedupe
  -> LinearConsumeOnce + ZeroTrust defaults
Server Sidecar [Rust]
  -> replay + signature + intent gate
ZigActores Runtime
  -> stateful Actor by Construction
  -> distributed process continuation
  -> Local EventStore
  -> CRDT projection
  -> ACK receipt
  -> CDC / propagation choreography
```

## Why the split exists

Semantic AtomicBehavior Type: LinearAutodestroy can prevent logical reuse of a consumed capability, but it cannot stop an attacker from copying serialized network bytes. UbiQ can redeliver safely, dedupe and ACK delivery, but it still cannot prove application-level single effect alone. CRDT can make duplicates harmless, but it cannot authenticate them. LEDSA composes the guarantees instead of conflating them.

## Processing rule

```text
receive
  -> validate transport
  -> validate DPoP/session/message hash
  -> replay guard
  -> semantic/intent validation
  -> claim logical event
  -> apply LinearAutodestroy
  -> append local
  -> apply CRDT
  -> ACK
```
