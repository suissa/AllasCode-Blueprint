---
name: CodeRuntime.ExecuteVerificationPlan.authoring
description: "Create and test the CodeRuntime.ExecuteVerificationPlan AtomicBehavior while preserving its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeRuntime.ExecuteVerificationPlan
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeRuntime.ExecuteVerificationPlan — Authoring Skill

Use this Skill when creating or changing the Action. Read the manifest, config, schemas, contract, scenarios, law and proof record before editing. Preserve the canonical label and version; add contract tests for success, duplicate, invalid input, denied authority, invariant violation, and crash/restart. Keep the declared scope and fixed Ok|Error events unchanged. Regenerate this Skill and the semantics Skill from the same source snapshot.

## Required checks

- validate every precondition and idempotency_key;
- prove the effect is inside the declared capability scope;
- assert no mutation is applied on Error;
- keep proof status specified until independent executable evidence exists.
