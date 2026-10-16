# Distributed Authority and Recovery

Status: normative architecture contract

## Purpose

Specify how a runtime maintains one authoritative history when Actors, schedulers, brokers, or storage nodes fail, restart, partition, or overlap during ownership transfer.

## Authority and ownership

1. Every effectful resource MUST have a defined authority for accepting writes.
2. Ownership claims MUST be tied to a lease, term, epoch, quorum decision, or equivalent fencing mechanism with explicit expiry and failure semantics.
3. A process that has lost authority MUST be unable to commit authoritative writes, even if it is still running or temporarily disconnected.
4. Ownership transfer MUST fence the former owner before the new owner is allowed to commit conflicting effects.
5. Membership information is not, by itself, proof of write authority. Liveness detection and authority election MUST be distinct concepts.
6. When quorum or authoritative storage is unavailable, the system MUST fail closed for operations whose safety depends on that authority. Availability may be reduced; conflicting committed histories are not acceptable.

## Network partitions and delivery

The contract MUST state which operations are available during a partition and which require quorum or authoritative coordination. Implementations MUST NOT claim exactly-once delivery as a transport property. They may provide effectively-once domain effects by combining at-least-once delivery with durable deduplication/idempotency and atomicity at the authoritative boundary.

Messages MUST include enough identity and version information to detect duplicates, stale ownership, and incompatible schemas. Retry backoff and dead-letter/reconciliation behavior MUST be bounded and observable. A poison message MUST not permanently starve unrelated work.

## Scheduler and capacity

Schedulers MUST distinguish assignment from successful execution and settlement. Work reassignment MUST preserve logical invocation identity and MUST not authorize two owners to commit the same non-idempotent effect concurrently. Capacity limits, queue saturation, retry exhaustion, and resource starvation MUST have observable outcomes and declared policies.

## Failure model

Each deployment profile MUST explicitly describe its assumptions for:

- node/process crash and restart;
- network partition and delayed/reordered/duplicated messages;
- authority/lease expiry and clock assumptions;
- broker or storage unavailability;
- partial failure between state commit and event publication;
- loss or corruption of snapshots/checkpoints;
- rolling upgrades and incompatible protocol/schema versions.

No implementation may claim tolerance of a failure mode that has not been included in its declared profile and tested or otherwise independently verified.

## Recovery requirements

Recovery MUST start from an authoritative source of state and preserve event IDs and idempotency keys. Projections and caches MAY be rebuilt if disposable. Recovery MUST validate checksums, schema/version compatibility, and event identity before accepting writes. Inbound mutations SHOULD remain paused until restored state and health checks pass.

A system MUST expose an explicit degraded/recovery state when it cannot prove that its state and ownership are safe. It MUST NOT convert uncertainty into a successful outcome.

## Required conformance scenarios

- former owner attempts a write after its fencing epoch is superseded;
- two schedulers concurrently attempt to claim the same work;
- partition removes quorum while an effectful operation is pending;
- storage commit succeeds but publication fails, followed by restart;
- duplicate and out-of-order event delivery;
- leader change during a request;
- corrupt or incompatible recovery bundle;
- rolling upgrade with mixed protocol versions.

## Reference implementation mapping

Potential reference modules in `suissa/AllasCode` include `cluster_membership.zig`, `distributed_scheduler.zig`, `quorum_operational_persistence.zig`, `event_store.zig`, and recovery conformance fixtures. The current implementation status must be checked before any guarantee is advertised as production-ready.
