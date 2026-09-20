---
name: CodeKnowledge.PublishHealingCase.authoring
description: "Create, modify, and test the CodeKnowledge.PublishHealingCase AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.PublishHealingCase
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeKnowledge.PublishHealingCase — Authoring Skill

Use this Skill whenever creating or changing the `CodeKnowledge.PublishHealingCase` artifact.

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
3. Keep write authority limited to: `knowledge/healing-cases/**`, `generated/skills/healing-cases/**`.
4. Add a counterexample and new proof obligations before changing validated semantics.
5. Test every success, failure, ambiguity and authority-boundary scenario.
6. Regenerate both Skills from the same source snapshot and verify their hashes.

## Mandatory invariants

- `INV-CASE-001`: only independently supported cases may be replay-eligible.
- `INV-CASE-002`: falsified cases remain negative knowledge that prevents repeated failed interventions.
- `INV-CASE-003`: inconclusive cases cannot authorize autonomous mutation.
- `INV-CASE-004`: the case records versions, evidence, mechanism, intervention, predictions, effects, regressions, and disposition.

## Forbidden authoring outcomes

- erase failed experiments.
- generalize beyond recorded compatibility constraints.
- publish unsigned external content as trusted.
- Do not rename terminal events; they remain `CodeKnowledge.PublishHealingCase.Ok` and `CodeKnowledge.PublishHealingCase.Error`.
- Do not mark the proof as proved without independent executable evidence.
