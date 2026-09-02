# eXtreme Zero Trust — LEDSA

**LEDSA (Linear Event-Driven Secure Architecture)** is an experimental AllasCode concept for composing cryptographic identity, linear resource semantics, explicit effects, actor coordination, event sourcing, CDC and CRDT convergence.

The central idea is not to claim that an at-least-once broker becomes physically exactly-once. Instead, LEDSA makes duplicate delivery safe and constrains **logical consumption** through capabilities, persistence receipts, replay guards and type-enforced transitions.

## Core invariant

```text
Processed(message) =>
  CryptoValid(message)
  && ReplaySafe(message)
  && IntentAllowed(message)
  && PersistedBeforeAck(message)
  && LinearTransitionValid(message)
```

The architectural target is stronger:

```text
InvalidState ∉ Program
InvalidState ∉ Network
```

## Polyglot responsibilities

| Plane | Responsibility |
| --- | --- |
| Rust | cryptography, sidecar boundary, sensitive handles |
| Austral | linear resources and single-consumption contracts |
| Koka | explicit effects and handlers |
| Gleam/BEAM | actor lifecycle, supervision and choreography |
| Haskell | Atomic Behavior Semantic Types and transition validation |
| NATS JetStream | durable at-least-once transport, dedupe and ACK primitives |
| CRDT | convergence under duplicates, delay and reordering |
| CDC | authoritative confirmed change stream |

## Security chain

```text
WebAuthn/FIDO2
  -> session binding / DPoP
  -> mTLS sidecar channel
  -> hybrid/PQ crypto provider
  -> signed linear event capability
  -> local append receipt
  -> ACK
  -> CRDT convergence
```

## Important distinctions

- Linear types provide a **local/static ownership guarantee**; serialized bytes can always be copied by an adversarial transport. Distributed replay protection therefore also requires message identifiers, nonces/JTIs, durable dedupe and receiver-side policy.
- NATS JetStream remains an at-least-once transport. LEDSA targets **exactly-once logical effect**, not a false exactly-once network guarantee.
- The Rust PQ layer in this base repository is crypto-agile by interface. Production ML-KEM / ML-DSA providers MUST replace the placeholder provider and MUST be independently reviewed.
- CRDT convergence does not imply instantaneous consistency.

## Layout

- `architecture/` — topology and 2flow choreography.
- `core/linear/` — language-neutral linear lifecycle expressed in TypeScript.
- `crypto/rust-sidecar/` — secure sidecar boundary and typestate pipeline.
- `messaging/nats-linear/` — linearized JetStream consumption contract.
- `state/` — eventstore, CRDT and CDC contracts.
- `agents/gleam-runtime/` — BEAM actor facade.
- `effects/koka-effects/` — explicit effect protocol.
- `types/austral-linear/` — static linear resource contract.
- `types/haskell-ast/` — Atomic Behavior Semantic Types.
- `sdk/` — public integration surfaces.
- `demos/` — executable topology scaffold.

## Status

This folder is a **research-grade executable blueprint**, not yet a security-reviewed production protocol. The requirements in `invariants.yml` are the source of truth for implementation and verification work.
