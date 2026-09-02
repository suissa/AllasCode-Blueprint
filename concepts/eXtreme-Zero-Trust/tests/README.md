# Required contract tests

A production implementation is incomplete until it has automated tests for:

- linear double-consumption rejection;
- append-before-ACK;
- broker duplicate/redelivery;
- replayed proof/JTI;
- wrong audience/session/message hash;
- crash recovery;
- CRDT commutativity/idempotence/associativity where applicable;
- stale revision rejection;
- actor supervisor recovery;
- crypto-provider negotiation and downgrade rejection;
- property tests for Atomic Behavior transitions.

Security claims MUST be tied to executable evidence, not documentation alone.
