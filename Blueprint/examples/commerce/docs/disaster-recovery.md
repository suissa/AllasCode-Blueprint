# Backup, Restore and Disaster Recovery

## v1 targets

- **RPO:** 15 minutes for mutable business/event data.
- **RTO:** 60 minutes from declared incident to a validated clean-environment restore.
- Event IDs and idempotency keys are part of the backup contract and must be restored unchanged.
- A restore is rejected before any write when the bundle checksum, schema version, event identity set, or idempotency identity set is invalid.

## Automated backup strategy

Persistent stores must export a `PersistentStoreSnapshot` at least every 15 minutes. Each snapshot contains the store name/version, records, event IDs and idempotency keys. Snapshots are assembled into a versioned `BackupBundle` with a SHA-256 checksum. Production implementations should write the bundle to encrypted, access-controlled storage separate from the primary deployment and apply retention appropriate to the business.

Recommended v1 cadence: 15-minute incremental/application snapshots, daily retained recovery point, weekly off-site copy. A deployment must not treat an unverified upload as a successful backup.

## Restore procedure

1. Provision a clean target environment without consuming new business messages.
2. Fetch the selected backup bundle from recovery storage.
3. Run `DisasterRecoveryRuntime.verify(bundle)` before writing anything.
4. Restore every store with `restore(bundle, target, traceContext)`.
5. Re-register original event IDs and idempotency keys exactly as captured.
6. Rebuild disposable projections/caches from restored authoritative data where applicable.
7. Run domain smoke tests and verify observability/health.
8. Only then reopen inbound providers and mutations.

Never generate replacement event IDs or idempotency keys during restore; doing so can replay effects already committed before the failure.

## Backup failure alert

Backup execution must share the runtime `ObservabilityRuntime`. A failed backup emits a `Backup` trace with `Error` and increments `backup.failure`. Production alerting should page/notify when this counter increases or when the newest successful recovery point exceeds the 15-minute RPO.

## Disaster-recovery rehearsal

Before v1 release, CI executes the recovery tests against an empty target. A rehearsal is considered passing only when checksum validation succeeds, data is written, event IDs/idempotency keys are preserved and `DisasterRecoveryRehearsal` is recorded as `Ok`.
