# Real Acceptance Runbook

This runbook executes issues #64 and #65 as one controlled acceptance session without weakening either gate.

## Preconditions
- Deploy the exact release candidate to production-equivalent staging.
- Use a real operator who is not the developer conducting the test.
- Do not use direct database access for normal operations.
- Use a real WhatsApp account/device where provider rules allow it.
- Record correlation IDs for every external/business flow.

## Required pilot evidence
1. `production-equivalent-staging`
2. `real-purchase`
3. `sale-resolution`
4. `whatsapp-real-device`
5. `ui-without-db-edits`
6. `restart-recovery`
7. `backup-restore`

`real-purchase` and `whatsapp-real-device` must contain external correlation IDs. Sandbox-only evidence is insufficient.

## Required operator tasks
1. `manage-master-data`
2. `purchase-ui`
3. `purchase-whatsapp`
4. `resolve-sale-whatsapp`
5. `verify-sale-ui`
6. `resolve-healing`

The session is invalid if `developer_assistance=true`, `database_access=true`, operator identity is missing, or a required task is skipped.

## Defects
Any open critical/high defect that blocks a critical workflow keeps acceptance blocked. Record the defect, reproduce it, fix it, rerun the affected task, and close it only with fresh evidence.

## Completion
Both `PilotReport.ready_for_release` and `RealOperatorAcceptance.status().ready` must be true for the same release candidate. Only then may #64 and #65 be closed and the final #66 release gate reevaluated.