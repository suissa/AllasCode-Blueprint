# v1.0.0 release candidate notes

Status: **prepared, not released**. The `v1.0.0` tag must not be created until the final release gate allows the approved commit.

## Product scope

The v1 commerce example covers supplier purchase intake, evidence-assisted product/supplier resolution, inventory and financial effects, detected sales/payment resolution, WhatsApp-assisted human clarification, customer/supplier management, reporting, administration, search/export and responsive/offline-aware Web UI.

## Runtime and semantic guarantees

- Intent/Action/Agent execution remains behind semantic contracts.
- Functions expose only `Ok` or `Error` outcomes at the semantic boundary.
- Self-healing and Human-in-the-Healing-Loop paths are explicit and traceable.
- Correlation, causation, idempotency and audit evidence are preserved across critical flows.
- Event replay and duplicate provider callbacks must not duplicate domain effects.

## Production-readiness evidence required

Release requires fresh semantic evidence, Semantic Merge Gate ALLOW, selector confidence target, security acceptance, performance/load/stress acceptance, backup/restore rehearsal, E2E acceptance, reproducible deployment, staging pilot evidence and real-operator usability acceptance.

## Deployment

A tagged v1 release is deployed as one immutable artifact through staging and then production. Production promotion must use the same artifact that passed staging. Rollback returns traffic to the previous known-good application release; destructive database down-migrations are not part of normal rollback.

## Known release blockers

Until the corresponding real-world evidence is recorded, staging-pilot and real-operator acceptance remain release blockers. Open critical/high defects and any release-blocking `[V1.0]` issue also prevent tagging.
