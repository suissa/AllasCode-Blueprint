---
name: CodeKnowledge.BuildObservationEnvelope.authoring
description: "Create, modify, and test the CodeKnowledge.BuildObservationEnvelope AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.BuildObservationEnvelope
skill_type: authoring
source_manifest: ../../manifest.yml
---

# CodeKnowledge.BuildObservationEnvelope — Authoring Skill

Use this Skill whenever creating or changing the `CodeKnowledge.BuildObservationEnvelope` artifact.

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

- `INV-OBS-001`: no evidence may be invented, repaired, or normalized into a different claim.
- `INV-OBS-002`: source, timestamp, execution, correlation, and causation provenance are preserved.
- `INV-OBS-003`: canonical serialization of identical evidence produces the same evidence hash.

## Forbidden authoring outcomes

- infer a root cause.
- mutate code or configuration.
- erase contradictory evidence.
- Do not rename terminal events; they remain `CodeKnowledge.BuildObservationEnvelope.Ok` and `CodeKnowledge.BuildObservationEnvelope.Error`.
- Do not mark the proof as proved without independent executable evidence.
