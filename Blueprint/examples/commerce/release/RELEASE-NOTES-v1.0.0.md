# AllasCode Commerce v1.0.0 — Release Notes

Status: **prepared, not yet released**.

This release is publishable only after `FinalReleaseGate` returns `ready=true`.

## Scope

- Semantic runtime with governed Actions, Agents, Intents, events and healing.
- Purchase intake from UI/WhatsApp evidence through supplier, stock and financial effects.
- Sale capture through payment detection, WhatsApp resolution, inventory decrement and financial closing.
- Inventory, financial, customer, supplier, fiscal and accounting capabilities.
- Persistent repositories, transactional/idempotency boundaries and reliable event delivery/replay.
- Web UI, responsive/offline resilience and real-time projections.
- Authentication, authorization, audit/observability, backup/restore, security and performance gates.
- Reproducible deployment, deterministic sandbox and operational runbooks.

## Release blockers that cannot be simulated

Before tagging `v1.0.0`:

1. `examples` branch protection must require the `semantic-ci` check (#23).
2. The production-equivalent real-business staging pilot must pass (#64).
3. A non-developer real operator must pass usability acceptance (#65).
4. No critical/high release-blocking defects may remain.
5. All release evidence must be fresh on the exact commit to be tagged.

## Tagging rule

The `v1.0.0` tag must point to the exact commit whose release evidence was approved. A different commit requires the complete gate to be executed again.
