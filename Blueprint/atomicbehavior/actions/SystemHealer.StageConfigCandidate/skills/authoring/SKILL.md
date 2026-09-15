---
name: SystemHealer.StageConfigCandidate.authoring
description: "Create, modify, and test the SystemHealer.StageConfigCandidate AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: SystemHealer.StageConfigCandidate
skill_type: authoring
source_manifest: ../../manifest.yml
---

# SystemHealer.StageConfigCandidate — Authoring Skill

Use this Skill whenever creating or changing the `SystemHealer.StageConfigCandidate` artifact.

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
3. Keep write authority limited to: `configs/core.yml#<authorized-healable-property>`.
4. Add a counterexample and new proof obligations before changing validated semantics.
5. Test every success, failure, ambiguity and authority-boundary scenario.
6. Regenerate both Skills from the same source snapshot and verify their hashes.

## Mandatory invariants

- `INV-CONFSTAGE-001`: only configs/core.yml and only an authorized healable property may change.
- `INV-CONFSTAGE-002`: Action implementations and semantic contracts are read-only.
- `INV-CONFSTAGE-003`: one causal configuration dimension changes per experiment whenever operationally safe.
- `INV-CONFSTAGE-004`: the candidate cannot promote or verify itself.

## Forbidden authoring outcomes

- modify code.
- change immutable or operator-only properties.
- change multiple unrelated settings.
- commit or merge.
- Do not rename terminal events; they remain `SystemHealer.StageConfigCandidate.Ok` and `SystemHealer.StageConfigCandidate.Error`.
- Do not mark the proof as proved without independent executable evidence.
