# Runtime Contract Index

These contracts define observable guarantees required from any conforming AllasCode runtime. They are implementation-neutral: Zig modules, databases, brokers, transports, and process supervisors are reference implementations, not the definition of correctness.

## Normative contracts

1. [Execution lifecycle and mailbox semantics](EXECUTION-LIFECYCLE.md) — invocation identity, actor lifecycle, mailbox admission, ordering, ACK boundaries, retries, checkpoints, and recovery.
2. [Distributed authority and recovery](DISTRIBUTED-AUTHORITY.md) — membership, fencing, partition behavior, duplicate delivery, idempotency, ownership transfer, and failure conformance.
3. [Privacy and security boundaries](PRIVACY-SECURITY.md) — purpose-bound access, least privilege, sensitive-data handling, cryptographic profiles, and audit evidence.
4. [State and Data Plane authority](STATE-DATA-PLANE.md) — authoritative writes, event history, outbox publication, projections, replay, and adapter conformance.
5. [Conformance matrix](CONFORMANCE-MATRIX.md) — mapping from contracts to reference modules and required evidence.

## Normative language

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as requirements when they appear in uppercase.

A module's presence, a passing unit test, or a successful example does not by itself establish production conformance. Each claim must identify the exact implementation/version, test or rehearsal, environment, and evidence artifact. Unknown or untested behavior remains **unverified**, not implicitly supported.

## Relationship to existing specifications

These contracts complement, and do not replace:

- [Intent Integrity Proof](../../docs/INTENT_INTEGRITY_PROOF.md)
- [Runtime overview](../README.md)
- [Actor lifecycle](../actor/lifecycle/README.md)
- [Event bus](../events/bus/README.md)
- [Event sourcing](../state/event-sourcing/README.md)
- [Interoperability](../../protocols/interoperability/README.md)

If a lower-level implementation detail conflicts with a semantic invariant or a declared contract, the semantic invariant and contract take precedence. Any intentional contract change requires versioning, migration notes, and updated conformance evidence.
