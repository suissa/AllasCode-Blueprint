# Linear semantics

LEDSA uses **Semantic AtomicBehavior Type: LinearAutodestroy** for local single-consumption semantics and **idempotent/replay-safe semantics** across the network.

A distributed byte sequence cannot literally be linear: bytes can be copied. Therefore the architecture distinguishes:

1. **Semantic single-consumption** — enforced through AtomicBehavior transitions and LinearAutodestroy state.
2. **Runtime local linearity** — consumed flags, opaque handles and Zig runtime capability tables.
3. **Distributed uniqueness** — message id, JTI, session binding, first-writer claim and durable replay state.
4. **Duplicate-safe effect** — CRDT/idempotent state transition.

Canonical lifecycle:

```text
LinearAutodestroyCapability!
  -> publish
  -> ClaimedMessage!
  -> consumeOnce
  -> destroyed
  -> append(LocalStore)
  -> LocalAppendReceipt!
  -> ackSync
  -> Acknowledged
```

A retry is not resurrection of the consumed object. It is issuance of a **new capability for a new attempt**, linked to the same logical event identity. The previous capability remains destroyed and cannot be consumed again.
