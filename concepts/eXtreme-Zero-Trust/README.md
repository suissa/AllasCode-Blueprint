# eXtreme Zero Trust — LEDSA

**LEDSA (Linear Event-Driven Secure Architecture)** is an experimental AllasCode concept for composing cryptographic identity, Zig-native transparent default effects, ZigActores runtime coordination, UbiQ transport semantics, Semantic AtomicBehavior Type: LinearAutodestroy, event sourcing, CDC and CRDT convergence.

The central idea is not to claim that an at-least-once transport becomes physically exactly-once. Instead, LEDSA makes duplicate delivery safe and constrains **logical consumption** through capabilities, persistence receipts, replay guards, LinearAutodestroy and type-enforced semantic transitions.

## Core invariant

```text
Processed(message) =>
  CryptoValid(message)
  && ReplaySafe(message)
  && IntentAllowed(message)
  && PersistedBeforeAck(message)
  && LinearAutodestroyValid(message)
  && ZigActorStateTransitionValid(message)
```

The architectural target is stronger:

```text
InvalidState ∉ Program
InvalidState ∉ Network
```

## Zig-first responsibilities

| Plane | Responsibility |
| --- | --- |
| Rust | cryptography, sidecar boundary, sensitive handles |
| Zig runtime | transparent default effects, deterministic execution boundaries, capability-scoped IO and effect settlement |
| ZigActores | BEAM-like runtime implementation, distributed process execution, supervision, choreography and stateful Actor by Construction |
| Semantic AtomicBehavior Type: LinearAutodestroy | semantic linear lifecycle, single-consumption capabilities and auto-destroyed links, challenges, tokens, events and credentials |
| Haskell | Atomic Behavior Semantic Types and transition validation |
| UbiQ | QUIC-first and NATS-compatible transport with ACK, first-writer, dedupe, retry, outbox aggregation, mTLS, optional DPoP, LinearConsumeOnce and ZeroTrust defaults |
| CRDT | convergence under duplicates, delay and reordering |
| CDC | authoritative confirmed change stream |

## UbiQ transport contract

UbiQ is the transport and consumption contract for this blueprint. It defaults to QUIC + NATS compatibility and can expose gRPC or WebSocket adapters when needed.

Required defaults:

```text
protocols.default = ["quic", "nats"]
protocols.optional = ["grpc", "websocket"]

security.mtls = required
security.dpop = optional/configurable
consumption.default = LinearConsumeOnce + ZeroTrust
delivery = ACK + first-writer + dedupe + replay guard
retry = 1 minute
outbox.aggregation = 1 minute per entity_id
tgc = 20-30 seconds
```

When a subscriber or Agent address is already known, UbiQ may deliver directly to that Agent socket over QUIC, with eBPF/XDP edge filtering as the fast-path boundary. Broker routing remains useful for discovery, routing, fallback and audit, not as the only path.

UbiQ also defines extended consumption variants:

```text
LinearConsumeAll
LinearConsumeAllZeroTrust
```

`LinearConsumeAllZeroTrust` encrypts payloads per subscriber. Each ACK releases a distinct decrypt key, and final consumption is accepted only after proof that the issued key was actually used.

## Security chain

```text
WebAuthn/FIDO2
  -> session binding / DPoP
  -> mTLS sidecar channel
  -> hybrid/PQ crypto provider
  -> signed LinearAutodestroy event capability
  -> UbiQ delivery / claim
  -> local append receipt
  -> ACK
  -> CRDT convergence
```

## Important distinctions

- LinearAutodestroy provides a **semantic single-consumption guarantee** for capabilities, events, links, challenges and tokens. Serialized bytes can always be copied by an adversarial transport, so distributed replay protection still requires message identifiers, nonces/JTIs, session binding, durable dedupe and receiver-side policy.
- UbiQ remains an at-least-once transport path at the delivery layer. LEDSA targets **exactly-once logical effect**, not a false exactly-once network guarantee.
- Zig runtime transparent default effects keep IO, crypto, state and network effects inside explicit runtime boundaries without exposing a separate public effects plane.
- ZigActores owns the BEAM-like lifecycle shape: actor construction, state ownership, supervision, distributed process continuation and choreography.
- The Rust PQ layer in this base repository is crypto-agile by interface. Production ML-KEM / ML-DSA providers MUST replace the placeholder provider and MUST be independently reviewed.
- CRDT convergence does not imply instantaneous consistency.

## Layout

- `architecture/` — topology and 2flow choreography.
- `core/linear/` — language-neutral linear lifecycle expressed in TypeScript.
- `crypto/rust-sidecar/` — secure sidecar boundary and typestate pipeline.
- `messaging/ubiq/` — UbiQ transport, ACK, first-writer, dedupe and consumption contract.
- `state/` — eventstore, CRDT and CDC contracts.
- `agents/zigactores-runtime/` — ZigActores BEAM-like actor runtime facade.
- `runtime/zig-effects/` — Zig runtime transparent default effects.
- `types/linear-autodestroy/` — Semantic AtomicBehavior Type: LinearAutodestroy.
- `types/haskell-ast/` — Atomic Behavior Semantic Types.
- `sdk/` — public integration surfaces.
- `demos/` — executable topology scaffold.

## Status

This folder is a **research-grade executable blueprint**, not yet a security-reviewed production protocol. The requirements in `invariants.yml` are the source of truth for implementation and verification work.
