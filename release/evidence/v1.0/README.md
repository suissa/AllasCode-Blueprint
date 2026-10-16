# AllasCode v1.0 — Real acceptance evidence

This directory contains evidence packages required before the v1.0.0 release. The automated gate validates that evidence is present and traceable; it cannot perform a real-business pilot, observe an operator, or judge the evidence itself.

## Required files

Create these files only after the corresponding activity has actually occurred:

- `staging-pilot.json` — production-equivalent staging, purchase, sale, WhatsApp, UI state, backup/restore, restart and defect triage.
- `operator-acceptance.json` — observed session with a non-developer operator, critical workflows, recovery guidance, assistance required and blocking defects.

Each file must be a JSON object with `status: "passed"`, `evidence_owner`, `evidence_uri`, and `completed_at` (ISO 8601). Every required acceptance field must contain a meaningful result or a link/reference to the underlying evidence. Do not use placeholders, invented test results, or a status of passed when any acceptance criterion failed.

## Evidence handling

- Store sensitive business/customer data outside Git; link to an access-controlled evidence location.
- Use synthetic/redacted identifiers in committed records.
- Include correlation IDs, timestamps, environment/version, test case and outcome in the linked evidence where applicable.
- Record failed cases and remediation, not only successful screenshots.
- A passing structural check is not proof of product correctness. A human release owner must review the underlying records and confirm issues #64 and #65 before #66 can be closed or `v1.0.0` tagged.

## Gate

Run locally:

```sh
python scripts/validate-v1-release-evidence.py
```

The check intentionally fails until both evidence files exist and satisfy the schema. That failure is expected before the real pilot and operator session have been completed.
