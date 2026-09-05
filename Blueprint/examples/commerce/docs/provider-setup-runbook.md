# Provider Setup Runbook

## WhatsApp / Evolution Go
Configure instance URL, instance identifier, `apikey` and a separate `x-allascode-webhook-secret`. Use TLS and network restriction. The provider is transport only; conversation/domain rules remain in the semantic runtime. Validate outbound text/media and inbound webhook before enabling production traffic.

## Payment provider / sale machine
Configure provider credentials as write-only secrets. First validate connection/status, then activate the configuration. Provider events must carry a stable external identifier used for idempotency. A detected payment without resolved products must remain pending and enter conversation/healing rather than closing a sale automatically.

## Fiscal provider
Configure jurisdiction/provider outside domain Actions. Validate sandbox issuance/status before activation. Fiscal external identifiers must be persisted and duplicate issuance prevented with idempotency. Timeout/rejection must surface as Error/healing, never as hidden retry that can duplicate issuance.

## Secret handling
Secrets are never returned by projections. Store through the secret Intent/path, validate connectivity, then activate configuration. Rotate by writing a new secret, validating, activating, observing provider health, then revoking the previous credential.

## Verification checklist
- Provider status projection reports configured/healthy.
- No raw secret appears in UI, logs, audit attributes or traces.
- Test event reaches ApplicationApi with correlation/idempotency metadata.
- Duplicate test event does not duplicate domain effect.
- Failure produces observable Error/healing evidence.