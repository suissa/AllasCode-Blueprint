# Incident Runbook

## Severity
- SEV1: financial/stock corruption risk, unauthorized mutation, sustained outage of critical commerce flow.
- SEV2: degraded provider/runtime path with workaround; no known corruption.
- SEV3: isolated failure or usability defect.

## First response
1. Stop unsafe inbound mutations if duplicate/corruption risk exists.
2. Record incident start time, `trace_id`, `correlation_id`, business IDs and affected provider.
3. Check health/metrics and recent Error traces.
4. Determine whether failure is transport, semantic healing, persistence, provider or projection/UI.
5. Do not manually edit operational tables to make projections look correct.

## Trace mapping
Intent trace → Event → Agent → Action → Provider. `causation_id` identifies the immediate predecessor and `correlation_id` groups the business flow. Healing and human interventions appear in the same trace continuity.

## Common incidents
### Provider outage
Keep domain state pending, prevent blind retries of critical mutations, restore provider connectivity, then resume through the original idempotency context.

### Duplicate callbacks
Verify provider message/event ID and idempotency store. If duplicate effects occurred, classify SEV1 and stop the affected ingress before reconciliation.

### Projection mismatch
Rebuild the projection from persisted events. Never patch the read model as the source of truth.

### Repeated healing
Inspect evidence confidence/ambiguities. Ask the operator only for missing/ambiguous facts. Escalate if corrected evidence repeatedly fails the same semantic boundary.

## Recovery
For application regression, roll traffic back to the previous known-good immutable release. For data loss/corruption, follow `disaster-recovery.md`: verify backup checksum, event IDs and idempotency keys before restore, rebuild projections, smoke-test, then reopen providers.

## Security incident / secret rotation
Disable or rotate compromised provider credentials, session material and webhook secret. Store replacement as write-only, validate connectivity, activate new configuration, revoke old credential, and inspect audit/traces for unauthorized operations.

## Closure
Document root cause, affected correlations, customer/business impact, recovery action, invariant/reconciliation evidence and preventive change.