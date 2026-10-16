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
| Independent domain models | [Independent model contract](../../../docs/runtime/INDEPENDENT_MODEL_CONTRACT.md) in AllasCode | External-model conformance fixtures/workflow | Model absent/invalid, path confinement, semantic/version compatibility |
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


## Initial implementation audit — 2026-10-16

The following findings were checked against the current `suissa/AllasCode` `main` source and the named test files. They are gaps or limits, not a claim that the complete contract suite has run during this audit.

| Finding | Source evidence | Current assessment | Follow-up |
|---|---|---|---|
| Mailbox overload and fairness | `system/runtime/a3e/src/mailbox.zig`, `mailbox_semantics_tests.zig` | Implemented and covered for bounded admission, explicit overload policies, bounded priority selection, and fairness budget. These unit tests do not prove durable admission across process/host loss. | Add crash/restart coverage for accepted mailbox messages to the execution lifecycle gate. |
| External side-effect ambiguity | `external_effects.zig`, `external_effects_tests.zig` | Tests cover idempotent proposal, duplicate receipts, ambiguous dispatch recovery, and settlement blocked until evidence. The in-memory settlement store does not alone prove durable recovery against a real external provider. | Require adapter-backed restart/reconciliation evidence before marking a deployment profile verified. |
| Membership transition atomicity | `cluster_membership.zig` | Review found that quorum cursor/state mutation can occur before all operation failures are ruled out (e.g. capacity or event-sequence failure). This may consume a proof or mutate state without a corresponding event. | [AllasCode issue #188](https://github.com/suissa/AllasCode/issues/188) — make validation and commit atomic; add error-path invariance tests. |
| Domain event durability and publication | `event_store.zig` is an in-memory bounded store; PostgreSQL conformance SQL currently demonstrates operational lease/queue/membership persistence, not durable domain event history plus atomic outbox intent. | Durable domain event replay and atomic event/publication boundary are not proven by these modules alone. | [AllasCode issue #189](https://github.com/suissa/AllasCode/issues/189) — define a persistent adapter, crash-window behavior, and CI evidence. |
| Data Plane capability negotiation | `data_plane.zig`, `data_plane_tests.zig` | Tests cover product-neutral capability negotiation and rejection of unsupported capability masks. This does not prove that every negotiated adapter is physically available; the implementation status document separately records the TigerBeetle binding as incomplete. | Keep Junior/PostgreSQL and Polyglot/TigerBeetle conformance claims separate and profile-specific. |
| PII boundary | `pii_boundary_tests.zig`, `docs/security/TEST_MATRIX.md` | Tests cover rejection of unsafe event PII references and plaintext metadata in selected observability paths. The inspected cases do not by themselves prove every success/error/healing/third-party telemetry path is covered. | Extend leak scanning across all sinks and error/healing paths before claiming cross-cutting verification. |

### Audit limitations

This was a source-and-test review through the GitHub repository interface. No local Zig build or GitHub Actions run was executed by this audit. The findings above therefore identify concrete source-level risks and evidence gaps; they must not be interpreted as a fresh green test result.