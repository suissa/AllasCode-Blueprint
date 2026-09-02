# Linear semantics

LEDSA uses **linear capability transitions** locally and **idempotent/replay-safe semantics** across the network.

A distributed byte sequence cannot literally be linear: bytes can be copied. Therefore the architecture distinguishes:

1. **Static/local linearity** — enforced by Austral or typestate/opaque handles.
2. **Runtime local linearity** — consumed flags/handle tables at FFI boundaries.
3. **Distributed uniqueness** — message id, JTI, session binding and durable replay state.
4. **Duplicate-safe effect** — CRDT/idempotent state transition.

Canonical lifecycle:

```text
LinearEvent!
  -> publish
  -> ClaimedMessage!
  -> append(LocalStore)
  -> LocalAppendReceipt!
  -> ackSync
  -> Acknowledged
```

A retry is not resurrection of the consumed object. It is issuance of a **new capability for a new attempt**, linked to the same logical event identity.
