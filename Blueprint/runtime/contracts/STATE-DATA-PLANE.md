# State and Data Plane Authority

Status: normative architecture contract

## Purpose

Define authoritative state, event history, mutation ownership, publication, projections, and recovery without coupling the semantic model to a particular database or message broker.

## Authority of writes

1. Every mutable domain aggregate or resource MUST have one declared authoritative write path per consistency boundary.
2. Only the designated authority may commit authoritative state. Agents may request mutations, but MUST NOT bypass the authority by writing directly to its storage.
3. A mutation is committed only when the declared durable transaction boundary confirms it. An in-memory update, emitted event, HTTP response, or broker publish alone is not sufficient unless the profile explicitly defines and verifies that boundary.
4. The state change and the intent to publish its corresponding event MUST be atomic or covered by a documented recovery protocol such as a transactional outbox.
5. Every effectful request MUST carry an idempotency identity. Deduplication state must be durable for at least the full retry/replay horizon declared by the deployment profile.
6. Conflict handling (optimistic version, serialization, lock, or equivalent) MUST be explicit. Silent last-write-wins is prohibited where it can violate a domain invariant.

## Event history

Events MUST have stable identity, schema/version, aggregate or partition identity where relevant, and provenance. The contract MUST distinguish event occurrence, durable recording, publication, consumption, application to a projection, and settlement.

The event store is authoritative only for the facts it is explicitly designated to own. A projection is a derived view and MUST NOT become an alternative writer for the same facts. Event corrections SHOULD use explicit compensating/corrective events rather than rewriting history, except where a legally required erasure policy explicitly defines a compliant mechanism.

## Outbox and consumers

- The outbox relay MUST be restartable and idempotent.
- A crash after state commit but before publication MUST eventually publish the pending event without reapplying the domain mutation.
- Consumers MUST tolerate duplicate delivery and record application progress durably when correctness depends on it.
- An ACK MUST identify what it acknowledges: receipt, durable acceptance, processing, projection application, or settlement.
- A downstream consumer's success MUST NOT be inferred from a publisher's success.
- Failed or poison events MUST have bounded retries and a recoverable dead-letter/quarantine path with provenance.

## Projections and rebuilds

Projections MUST be reproducible from their declared authoritative sources and schema versions. Rebuilds MUST be isolated from live mutation paths or use a safe catch-up protocol. Projection lag, rebuild progress, and failures MUST be observable. A projection may be eventually consistent only when the owning Intent and user-facing contract allow that staleness.

## Storage adapters

An adapter MUST declare its consistency, transaction, durability, ordering, idempotency, and recovery capabilities. A common interface MUST NOT imply guarantees that an underlying store cannot provide. Capability negotiation must reject a deployment whose required guarantees exceed the adapter's declared guarantees.

Financial or conserved-quantity invariants MUST be enforced at the authoritative transaction boundary, not solely in a projection or application-level pre-check.

## Required conformance scenarios

- duplicate mutation request;
- commit succeeds but outbox publication fails;
- consumer applies event but crashes before ACK;
- projection rebuild while new events arrive;
- adapter reports success before durability is established;
- concurrent writes violate a conserved quantity unless serialized;
- restore preserving event and idempotency identities;
- adapter whose declared guarantees are weaker than the Intent requires.

## Reference implementation mapping

Potential reference areas include `system/runtime/a3e/src/data_plane.zig`, `event_store.zig`, `checkpoint.zig`, and `system/runtime/a3e/data-plane/poly/src/outbox-relay-agent.mjs` plus operational persistence SQL/conformance tests. The active implementation profile must be evaluated before claiming a specific store or adapter conforms.
