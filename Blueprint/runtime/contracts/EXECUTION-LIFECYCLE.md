# Execution Lifecycle and Mailbox Semantics

Status: normative architecture contract

## Purpose

Define the observable lifecycle of an invocation independently of language, process model, scheduler, or transport. A conforming implementation must preserve the original Intent and must not report success merely because a request was received or an Action returned locally.

## Canonical identities

Every invocation MUST carry stable identifiers for the Intent, invocation, Action/AtomicBehavior version, Actor incarnation or fencing epoch, correlation/trace context, and idempotency key where effects can be repeated. Identifiers MUST survive retry and recovery when they refer to the same logical operation. A replacement attempt MUST be distinguishable from the original attempt without losing the logical invocation identity.

## Lifecycle

The implementation MUST distinguish these states (an implementation may expose additional internal states):

`received → admitted → executing → effect-committed → verified → settled`

Failure paths may transition to `rejected`, `retryable-error`, `terminal-error`, or `recovery-required`. A state transition MUST have a defined authority and durable boundary.

- **Received** means bytes/message were observed. It does not promise acceptance.
- **Admitted** means authorization, schema, capacity, and policy checks passed.
- **Executing** means the Action may be running. It is not evidence of a committed effect.
- **Effect committed** means the authoritative effect has crossed its declared durability boundary.
- **Verified** means the required postconditions, invariants, and evidence checks passed.
- **Settled** means the declared completion contract is satisfied, including required downstream acknowledgements when the Intent requires them.
- **Rejected** means no effect was admitted; rejection must identify a stable reason category.
- **Recovery required** means the runtime cannot safely claim success or safe retry without reconciliation.

An external `Ok` MUST only be emitted at the contract-defined success boundary. The default boundary is `settled`, not `received`, `admitted`, or merely `executing`.

## Admission and mailbox

1. Authorization, input-schema validation, policy checks, and capacity admission MUST occur before an invocation can cause domain effects.
2. A full mailbox MUST apply a declared policy: backpressure, bounded wait, explicit rejection, or redirect to an authorized replacement. Silent loss is forbidden.
3. Mailbox ordering guarantees MUST be explicit per key/partition/Actor. A runtime MUST NOT claim global order unless it actually enforces it.
4. Concurrent events MUST be ordered by a deterministic rule or expose that their order is unspecified. Hidden timing-dependent priority is not a portable contract.
5. Messages from stale Actor incarnations MUST be rejected using a fencing token, epoch, or equivalent authority mechanism.
6. Duplicate delivery MUST be expected. Effectful Actions MUST use idempotency, deduplication, or an explicit reconciliation/compensation contract.

## Retry, checkpoint, and replay

- A retry MUST preserve the logical invocation and idempotency identity.
- The runtime MUST know whether the prior attempt had no effect, a committed effect, or an uncertain effect before replaying a non-idempotent operation.
- A checkpoint MUST identify the exact Action boundary, semantic contract version, relevant state/event position, and evidence needed to resume.
- Replay MUST preserve event identity and order as recorded. Determinism may only be claimed for Actions whose declared dependencies and effects are deterministic or replay-controlled.
- A process restart MUST NOT be treated as proof that an in-flight effect did not occur.
- If effect status cannot be established, the runtime MUST enter reconciliation or human-assisted recovery rather than blindly repeat the effect.

## Actor lifecycle and replacement

Registration, readiness, execution, draining, suspension, replacement, and termination MUST be distinguishable states. A replacement Actor MUST acquire valid authority before accepting effectful work. The prior incarnation must be fenced from further authoritative writes. In-memory mailbox transfer alone is not durable recovery; the contract must state how accepted messages survive a process or host loss.

## Required conformance scenarios

Every runtime implementation MUST test:

- rejection before side effects for invalid or unauthorized input;
- full mailbox behavior and explicit backpressure/rejection;
- duplicate delivery of a side-effecting request;
- crash before commit, after commit but before ACK, and after ACK;
- stale Actor message/write after replacement;
- checkpoint restore and replay with preserved event/idempotency identities;
- uncertain effect outcome requiring reconciliation;
- distinction between Action-level `Ok` and overall Intent settlement.

## Reference implementation mapping

The AllasCode repository contains candidate/reference modules including `system/runtime/a3e/src/mailbox.zig`, `event_store.zig`, `checkpoint.zig`, `distributed_scheduler.zig`, `cluster_membership.zig`, and associated tests. These are evidence inputs, not automatic proof that every clause above is implemented.
