# Deployment Runbook

## Clean installation
1. Install Docker/Compose and Node.js 24 for validation tooling.
2. Clone the repository and checkout the approved release commit/tag.
3. Create production environment configuration outside source control. Populate database, Redis/NATS, provider credentials and webhook secret through the deployment secret mechanism.
4. Run the full acceptance suite before promotion: security audit, performance acceptance, E2E acceptance and semantic/core tests.
5. Start persistent dependencies, wait for their health checks, run versioned migrations, then start the application.
6. Do not enable inbound providers until `/health` and readiness report healthy/ready and smoke tests pass.

## Promotion
Build/deploy an immutable release identifier. Deploy the exact same artifact to staging first. After staging acceptance, promote that same artifact to production; do not rebuild between environments.

## Migration safety
Migrations must be idempotent and tracked by migration/version metadata. Prefer expand/contract, backward-compatible changes. Never make application rollback depend on a destructive down migration.

## Rollback
1. Stop or drain new unsafe mutations if required.
2. Route application traffic to the previous known-good immutable release.
3. Verify readiness and core smoke flows.
4. Keep compatible database migrations in place.
5. If data corruption/loss occurred, use the Disaster Recovery runbook instead of attempting ad-hoc database rollback.

## Post-deploy checks
- health = healthy; readiness = ready;
- provider status healthy/configured;
- one read projection query succeeds;
- one sandbox/smoke command reaches the semantic runtime;
- no new high-severity Error traces;
- backup/recovery capability remains available.

## Configuration inventory
Document for each environment: application port, PostgreSQL endpoint/storage, Redis endpoint/storage, NATS endpoint, provider endpoints, secret names, release identifier and backup location. Secret values must never be committed.