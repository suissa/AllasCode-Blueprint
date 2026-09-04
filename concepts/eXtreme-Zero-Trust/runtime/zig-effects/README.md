# Zig runtime transparent default effects

Domain code requests crypto, network, state and intent operations through Zig runtime effect boundaries. Effects are transparent by default at the application surface, but the runtime still records and settles them explicitly.

The runtime owns:

- capability-scoped IO
- deterministic execution boundaries
- crypto/network/state/intent effect settlement
- replay-safe effect confirmation
- LinearAutodestroy-aware cleanup

The goal is not a separate public effects plane. The goal is one Zig runtime path where normal behavior code remains clean while side effects are captured, classified and verified by the runtime.
