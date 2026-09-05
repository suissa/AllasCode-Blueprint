# Semantic Healing

This directory defines the v1 recovery contract for the commerce runtime. Healing is configuration and graph data; Actions do not hide retry, fallback, normalization, or human-escalation rules in their implementations.

## Files

- `manifest.yml` identifies Semantic Healing as a runtime capability.
- `config.yml` defines default retry limits, timeout/backoff, human-resume TTL, normalization restrictions, and audit requirements.
- `strategies.yml` declares the concrete healing strategies, the Actions to which they apply, matching rules, and which strategy authorizes a governed fallback.
- `reversible-normalization.ts` is the only normalization primitive supplied by the example. It accepts only the `validation` and `self-healing` phases and refuses any transformation that cannot reconstruct its original value.

## Runtime contract

At graph build time, strategies become `HealingStrategy` nodes. `Action --HEALED_BY--> HealingStrategy` identifies allowed recovery behavior. Strategies implement `RuntimeCapability:SemanticHealing`. Existing semantic alternatives remain governed by `SEMANTICALLY_EQUIVALENT_TO`, `SUBSTITUTABLE_BY`, and `FALLBACK_TO`; the fallback trigger is bound to a HealingStrategy rather than interpreted from a hardcoded Action name.

The runtime executes recovery in this order when applicable:

1. execute the original Action;
2. retry only while the graph-declared total-attempt budget permits it;
3. enforce the graph-declared timeout/backoff on healing retries;
4. use a `FALLBACK_TO` Action only when its graph-bound strategy matches and the Semantic Governor has proven the alternative preserves the source contract/governance obligations;
5. create a Human-in-the-Healing-Loop case when required information cannot be derived reversibly;
6. otherwise return the Action's declared Error contract.

A retry timeout does not create a third result-event type. It emits the same Error event declared by the Action and records the timeout in the payload.

## Human-in-the-Healing-Loop

A human escalation stores the original Intent, failed Agent/Action, original event and payload, payload hash, error, correlation identifier, one-use resume token, and expiration. Repeated escalation for the same pending correlation/action is idempotent. `FlowRuntime.resume()` consumes the token once, executes the failed Action with the supplied human correction, then continues from that Action's result event; it does not replay earlier successful Flow effects.

The in-memory store in this example demonstrates the contract. Durable persistence and channel/API exposure are tracked separately because persistence and transport must not own healing semantics.

## Auditing

Initial attempts, retries, fallbacks, human escalations, resumes, and terminal failures produce audit records. Payload hashing uses SHA-256 according to `config.yml`; the full in-memory payload is retained only to demonstrate safe Flow resume in this executable example.
