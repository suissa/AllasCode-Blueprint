---
name: CodeManager.CreateHealingHypothesis.authoring
description: "Create, modify, and test the CodeManager.CreateHealingHypothesis AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeManager.CreateHealingHypothesis
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeManager.CreateHealingHypothesis — Authoring Skill

Use this Skill whenever creating or changing the `CodeManager.CreateHealingHypothesis` artifact.

## Required artifact files

- `manifest.yml`, `config.yml`;
- input, output and event schemas;
- immutable contract and scenarios;
- fixed `Ok|Error` events;
- authority law and proof-evidence record;
- contract tests and both Skill projections.

## Authoring procedure

1. Read the manifest, contract, schemas, scenarios, law and existing test evidence completely.
2. Preserve the canonical label and increment the version for a semantic contract change.
3. Keep write authority limited to: `[]`.
4. Add a counterexample and new proof obligations before changing validated semantics.
5. Test every success, failure, ambiguity and authority-boundary scenario.
6. Regenerate both Skills from the same source snapshot and verify their hashes.

## Mandatory invariants

- `INV-HYP-001`: the CodeManager has no mutation authority.
- `INV-HYP-002`: fault class is exactly code, system, or unknown.
- `INV-HYP-003`: every hypothesis states supporting evidence, contrary or missing evidence, alternatives, predictions, and falsification criteria.
- `INV-HYP-004`: known verified cases are contextual priors, never unconditional commands.

## Forbidden authoring outcomes

- request simultaneous code and config mutation in one experiment.
- derive cause only from the final error.
- write a candidate.
- Do not rename terminal events; they remain `CodeManager.CreateHealingHypothesis.Ok` and `CodeManager.CreateHealingHypothesis.Error`.
- Do not mark the proof as proved without independent executable evidence.
