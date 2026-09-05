# V1 Security Threat Model

## Scope

Trust boundaries covered by this model: Web UI, Application API, WhatsApp/Evolution Go ingress, media processing, payment/provider callbacks, authentication/authorization, persistence/backup, and CI/release automation.

## Threats and controls

| Boundary | Threat | Required control |
|---|---|---|
| Web UI -> API | injection, IDOR, privilege escalation | typed input validation; server-side scope/resource authorization; never trust browser-computed authority |
| WhatsApp webhook | forged callback, replay, flood | deployment secret, constant-time comparison, message-id replay protection, rate limit, TLS/network restriction |
| Media | executable/polyglot payload, traversal metadata, oversized payload | allowlisted MIME types, size limit, filename metadata validation, extraction in isolated adapter |
| Provider callbacks | spoof/replay | provider-specific authentication plus correlation/idempotency/replay guard |
| Auth | missing/overbroad scope | deny by default; explicit scopes; protected mutations require operator identity |
| Persistence | secret disclosure, destructive restore | secrets outside client-visible config; encrypted deployment storage; verified backup checksum; preserve event/idempotency identities |
| Logs/traces | credential/PII disclosure | recursive sensitive-field redaction before observability storage |
| CI/dependencies | vulnerable dependency or bypassed tests | `npm audit --audit-level=high`; semantic/security tests are release gates |

## Release blocking findings

V1 release is blocked by any unresolved Critical or High finding affecting an in-scope production path. Medium/Low findings require an owner and documented disposition.

## Secret handling

Production API keys, webhook secrets and credentials must be injected from deployment secret storage/environment. They must not be committed to repository configuration or returned by client-facing projections. Configuration UIs expose only whether a secret is configured.

## Validation rule

Security checks at the edge do not replace domain validation. Edge validation rejects malformed/unsafe transport input; semantic/domain validation still decides whether an accepted value is valid for the business operation.
