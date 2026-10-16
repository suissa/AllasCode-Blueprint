# AllasCode Implementation Conformance Matrix

This matrix links Blueprint contracts to candidate reference implementation areas. It is a verification plan, not a blanket claim that every requirement is already satisfied.

## Status vocabulary

- **Specified** — contract exists.
- **Implemented** — code path exists, but may not cover all required scenarios.
- **Tested** — a reproducible test has exercised the named behavior.
- **Verified** — evidence was inspected and supports the exact claim/version/environment.
- **Production accepted** — production-like rehearsal and operational acceptance passed.

A row MUST NOT advance merely because code or a test file exists. Evidence should include commit SHA, command/workflow URL, environment/profile, result, and known limitations.

| Contract area | Blueprint contract | Candidate AllasCode reference | Required evidence |
|---|---|---|---|
| Execution lifecycle/mailbox | [Execution lifecycle](EXECUTION-LIFECYCLE.md) | `mailbox.zig`, `checkpoint.zig`, `event_store.zig`, mailbox tests | Crash-window, duplicate, ordering, stale-epoch, checkpoint/replay scenarios |
| Distributed authority | [Distributed authority](DISTRIBUTED-AUTHORITY.md) | `cluster_membership.zig`, `distributed_scheduler.zig`, quorum persistence, recovery fixtures | Fencing, partition, concurrent claims, failover, schema compatibility |
| Privacy/security | [Privacy and security](PRIVACY-SECURITY.md) | `pii_protection.zig`, `pii_runtime.zig`, observability tests, `docs/LGPD-native.md` | Data-leak scans across success/error/telemetry, auth boundaries, replay and downgrade cases |
| State/Data Plane | [State and Data Plane](STATE-DATA-PLANE.md) | `data_plane.zig`, `event_store.zig`, poly PostgreSQL adapter, outbox relay | Real persistence, crash after commit, idempotent publication/consumption, restore |
| Intent integrity | [Intent Integrity Proof](../../docs/INTENT_INTEGRITY_PROOF.md) | intent-integrity runtime/specs and publication proof tests | Independent verifier, authorized trajectory, invariant and provenance checks |
| Independent domain models | [Independent model contract](../../../../docs/runtime/INDEPENDENT_MODEL_CONTRACT.md) in AllasCode | External-model conformance fixtures/workflow | Model absent/invalid, path confinement, semantic/version compatibility |
| Cryptographic agility | [Privacy and security](PRIVACY-SECURITY.md) plus the versioned implementation profile | security/transport modules and test vectors | Interoperability, rotation, downgrade/replay rejection; no secrets in evidence |
| Self-healing/evolution | [Autonomous optimization architecture](../../architecture/autonomous-optimization/README.md) | MAPE-K, semantic healing, governance, candidate promotion and rollback | Negative authorization tests, immutable contract, independent validation, rollback rehearsal |

## Required evidence record

For each claimed conformance result, record:

- contract ID and version;
- repository commit SHA and implementation/profile version;
- scenario/test ID and exact invocation;
- environment and relevant dependency versions;
- expected and observed outcome;
- immutable evidence URI or artifact digest;
- verifier identity/version;
- limitations and untested failure modes;
- reviewer and verification timestamp.

Sensitive values, credentials, raw tokens, and unnecessary personal data MUST NOT be embedded in the record.

## Release gate

A runtime profile is conformant only when all mandatory contracts applicable to that profile are **Verified**. A production release additionally requires operational acceptance, restore rehearsal, security review, and declared SLO/limits. Missing evidence is **unverified**, not passed.

The matrix should be updated as part of changes to contracts, runtime modules, or release evidence workflows. Do not copy a passing result from a different commit or deployment profile.
