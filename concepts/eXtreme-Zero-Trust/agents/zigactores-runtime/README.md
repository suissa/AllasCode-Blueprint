# ZigActores runtime

ZigActores is the LEDSA actor runtime target: a BEAM-like implementation in Zig with supervision, choreography, distributed process continuation and stateful Actor by Construction.

The actor is stateful by construction: state ownership is explicit, transitions are validated by AtomicBehavior semantics, and a process can be continued by another runtime node only through a signed state handoff.

Responsibilities:

- actor lifecycle and supervision
- distributed process continuation
- stateful Actor by Construction
- mailbox/message validation
- Local EventStore append before ACK
- CRDT projection after accepted transition
- choreography with UbiQ delivery and ACK
