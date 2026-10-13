# Agent, Actor, Action and Internal 2flow

**Status:** canonical conceptual specification for AllasCode and the Chappie Agent2Actor2Action A3 runtime.

## 1. Definitions

**Agent** is a semantic responsibility boundary. It owns an objective, context, policies, and lifecycle; it receives Intents or events and selects or coordinates Behaviors to achieve an outcome.

**Actor** is an execution, state-ownership, and concurrency boundary. It owns assigned mutable runtime state and processes messages according to its mailbox and scheduling policy. An Actor can be a lightweight Zig runtime object; it does not have to be an LLM, OS process, or thread. One Agent may be implemented by one Actor, or coordinate several Actors for bounded responsibilities.

**Action** is a bounded executable operation with a stable identity and a versioned input/output contract, preconditions, declared effects, idempotency semantics, and failure behavior.

**Internal 2flow** is a declarative, versioned execution trajectory that composes Actions with dependencies, conditions, branches, joins, and failure/recovery paths. It defines which transitions are allowed and what evidence is required to accept the outcome. It is more than a list of function calls and more than a message route.

**Sentinel** is the supervisory boundary around an Actor's incoming work. It validates messages, establishes ordering, durably admits work, coordinates dispatch, and tracks acknowledgements. **Mailbox** is the Actor's message boundary; when durable, its log—not an in-memory queue—is the recovery source of truth.

## 2. Conceptual relationship

```text
Intent
  ↓
Agent selects a Behavior
  ↓
Behavior is described by an internal 2flow
  ↓
2flow schedules Actions and evaluates transitions
  ↓
Actor runtime owns state and controls message processing
  ↓
Events + Evidence describe what happened
  ↓
Outcome is accepted when declared postconditions hold
```

These are semantic roles, not necessarily separate processes or objects.

| Concept | Question answered |
|---|---|
| Agent | Which responsibility and objective does this unit own? |
| Actor | Who owns this mutable state, and how is concurrency controlled? |
| Action | Which bounded operation can be executed? |
| 2flow | Which trajectory and transitions are permitted? |
| Event | What occurrence or state transition was recorded? |
| Evidence | What supports the claim that a condition or outcome holds? |

Do not collapse these concepts into `Agent = Actor = Action = thread = process`. They solve different problems.

## 3. What an internal 2flow declares

A flow should define:
- stable identity and immutable version;
- entry condition, typed inputs/outputs, and expected outcome;
- ordered steps and explicit dependencies;
- conditions, branches, joins, and failure paths;
- retry, timeout, cancellation, and compensation policy where applicable;
- state/event effects and idempotency requirements;
- evidence and postconditions required for completion.

The runtime interprets the flow; Actions perform bounded work; Events record occurrences; Evidence supports outcome acceptance. A successful return from the last Action is not automatically proof that the business outcome was achieved.

Illustrative pseudocode (not the formal grammar):

```text
flow StoreMemory v1
  input: MemoryWriteIntent
  step validate:
    action: ValidateMemoryWrite
    on_failure: reject
  step persist:
    action: AppendDurableMailbox
    requires: validate.success
  step apply:
    action: ApplyStorageMutation
    requires: persist.durable_ack
    idempotency_key: input.event_id
  step confirm:
    action: RecordProcessingAck
    requires: apply.committed
  outcome:
    accept_when: confirm.recorded
```

The concrete `.2flow` grammar, parser, and tooling belong to the [2flow repository](https://github.com/suissa/2flow). This document defines the semantic responsibilities, not a competing syntax.

## 4. Actor state and mailbox semantics

Messages enter through the Actor's mailbox and are processed according to an explicit ordering policy. For a single ordered stream, sequence numbers must be monotonic and uniquely assigned within that stream. Timestamps alone do not establish order.

The lifecycle must distinguish:
1. received;
2. durably accepted;
3. dispatched;
4. action started;
5. state mutation committed;
6. processing acknowledged;
7. replicated, if required.

These transitions represent different guarantees. An ACK must never claim a stronger guarantee than the system has established. The Actor should normally serialize mutations to its own state; parallelism should occur across independent Actors or explicitly partitioned streams unless safe concurrency is formally defined.

A local in-memory broker is useful for notification and dispatch, but it is not durable truth. On restart, pending work must be reconstructed from the durable mailbox/WAL.

## 5. Mapping to Chappie Agent2Actor2Action A3

- **Stateful Agent:** owns the semantic responsibility and lifecycle.
- **Sentinel:** validates inbound messages, establishes order, durably records accepted work, schedules dispatch, and tracks ACKs.
- **Mailbox/WAL:** recovers accepted work after process restart.
- **In-memory broker:** optimizes local delivery; it is not the source of truth.
- **ManagerAgent:** applies resource-specific mutations through the adapter for its backend.
- **Replication Outbox / CloneAgent:** retain events required for remote durability and recovery.
- **Recovery Coordinator:** reconciles checkpoints, detects gaps, and replays outstanding work.

The 2flow defines which trajectory is valid; the A3 runtime provides execution, persistence, concurrency, replication, backpressure, and recovery mechanics.

A Clone must not automatically become a second active writer. Before ownership can move, define fencing/epoch or lease rules, and an explicit handoff protocol.

## 6. Errors and outcome acceptance

Flows should distinguish invalid input, authorization failure, transient infrastructure failure, permanent domain rejection, conflict/stale state, timeout/cancellation, and unknown outcome. Retry is safe only when the operation is idempotent or has a deduplication/reconciliation mechanism. If commit status is unknown, reconcile through durable event identity and backend evidence instead of blindly repeating a non-idempotent side effect.

A failed Action does not always fail the whole flow. The declared policy may retry, compensate, replan, wait, or escalate to a human. Completion requires the flow's declared postconditions and evidence.

## 7. Normative invariants

1. Agents and Actors have stable identities in their declared scopes.
2. Actions declare input/output contracts, preconditions, effects, and failure semantics.
3. Published 2flow versions are immutable; running executions stay pinned unless explicitly migrated.
4. Durably accepted messages survive restart within the configured storage guarantee.
5. Local commit is not acknowledged before the backend confirms it.
6. Duplicate delivery must not duplicate a logical effect when the operation is declared idempotent.
7. Ordering guarantees are explicit and scoped to a stream or partition.
8. An in-memory broker is never the sole source of durable work.
9. A replication ACK means the receiver persisted the event to the promised durability level.
10. Flow completion requires declared outcome conditions and evidence.
11. A replica cannot become an independent writer without an ownership-transfer protocol.
12. Resource mutations pass through the resource-owning Actor/Manager or an explicit coordination protocol.

## 8. Repository responsibilities

- **AllasCode-Blueprint:** canonical architecture and conceptual definitions for Agent, Actor, Action, and internal 2flow.
- **AllasCode:** runtime semantics and implementation contracts, including behavior execution, events, state, validation, and evidence.
- **Chappie-Agent2Actor2Action-A3:** Zig runtime mechanics for stateful Actors, Sentinel, mailbox/WAL, broker, Manager dispatch, replication, and recovery.
- **2flow:** formal syntax, parser, validation, and tooling for `.2flow` artifacts.
