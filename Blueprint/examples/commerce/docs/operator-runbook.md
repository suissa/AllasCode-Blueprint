# Operator Runbook

## Purpose
Operate the v1 commerce system without database access or architecture knowledge.

## Daily checks
1. Open the Dashboard and confirm no critical item is in `healing_required`.
2. Check stock alerts and unresolved sales.
3. Confirm payment/provider status from Administration → Integrations.
4. Review recent audit activity for failed protected operations.

## Common operations
- Products/stock: use Products & Inventory. Manual stock adjustment requires an explicit reason and backend authorization.
- Purchases: register through UI or WhatsApp-assisted intake. Evidence with low confidence must be confirmed before domain effects occur.
- Sales: unresolved provider sales remain pending until products are identified. Resolve through WhatsApp or Sales UI.
- Customers/suppliers: create or update through semantic Intents only; duplicates should be resolved instead of manually editing persistence.

## Healing states
`waiting-human`: the runtime has insufficient or ambiguous information. Read the reason/evidence, correct only the requested facts, and submit confirmation.

`Error`: the Intent did not produce a valid domain effect. Preserve the operator draft, correct the indicated field or authorization issue, and resubmit with the same logical operation/idempotency context when appropriate.

Never bypass healing by editing database records.

## Escalation
Escalate when the same correlation ID repeatedly fails after the requested human correction, health is degraded, provider callbacks stop arriving, or financial/stock reconciliation does not match projected events. Capture `trace_id`, `correlation_id`, time window and affected business identifier.