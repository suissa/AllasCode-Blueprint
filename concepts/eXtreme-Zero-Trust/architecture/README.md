# Architecture

LEDSA separates correctness into orthogonal enforcement planes instead of assuming a single technology can guarantee distributed linearity.

```text
Human
  -> WebAuthn
Client Agent
  -> DPoP proof
Client Sidecar [Rust]
  -> mTLS + hybrid PQ provider
NATS JetStream
  -> durable delivery
Server Sidecar [Rust]
  -> replay + signature + intent gate
BEAM Actor [Gleam]
  -> Local EventStore
  -> CRDT projection
  -> ACK receipt
  -> CDC / propagation choreography
```

## Why the split exists

Austral can statically prevent local duplication of a capability, but it cannot stop an attacker from copying serialized network bytes. NATS can redeliver safely, but it cannot prove application-level single effect. CRDT can make duplicates harmless, but it cannot authenticate them. LEDSA composes the guarantees instead of conflating them.

## Processing rule

```text
receive
  -> validate transport
  -> validate DPoP/session/message hash
  -> replay guard
  -> semantic/intent validation
  -> claim logical event
  -> append local
  -> apply CRDT
  -> ACK
```
