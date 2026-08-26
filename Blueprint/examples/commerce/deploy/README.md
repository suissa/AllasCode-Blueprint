# Production deployment

The production artifact is immutable; environment-specific configuration and secrets are injected at deploy time through `production.env`/the target secret manager. Never commit `production.env`.

## Services

- application: HTTP 8080, health/readiness 8081
- PostgreSQL 17: persistent write/event state
- Redis 8: cache/ephemeral coordination
- NATS 2.11 JetStream: durable integration messaging
- Evolution Go: external WhatsApp provider, configured by URL and write-only API key

Persistent volumes are `postgres-data`, `redis-data` and `nats-data`. Backups follow the v1 DR procedure and must be verified before a production rollout.

## Deployment order

1. Resolve the immutable `v1.x.y` image/tag and inject environment configuration/secrets.
2. Start dependencies and wait for their health checks.
3. Run forward-only, idempotent migrations and record each migration ID in the migration ledger.
4. Start the candidate application.
5. `/health` proves process liveness; `/ready` requires configuration, database, event bus, cache and current migrations.
6. Run smoke/E2E acceptance before shifting traffic.
7. Mark the release as active only after readiness passes.

## Rollback

Do not reverse destructive database migrations during an incident. Route traffic back to the previous known-good application release. Database changes for v1 must therefore be backward-compatible (expand/migrate/contract). Restore from backup is a disaster-recovery operation, not a normal application rollback.

The tested `DeploymentController` models activation and rollback between known-good releases and refuses activation when readiness fails.

## Secrets

Required secrets include `DB_PASSWORD`, `EVOLUTION_GO_API_KEY`, `ALLASCODE_WEBHOOK_SECRET`, registry credentials and environment deployment credentials. The example env file contains placeholders only.

## CI/CD

Pull requests execute the complete semantic CI. Tagged `v1.*.*` releases are eligible for staging deployment first. Production promotion uses the same immutable artifact after staging acceptance and environment approval; the workflow must not rebuild different code for production.
