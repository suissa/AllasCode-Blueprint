---
name: HumanHealing.RequestContext.authoring
description: "Create, modify, and test the HumanHealing.RequestContext AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: HumanHealing.RequestContext
skill_type: authoring
source_manifest: ../../manifest.yml
---

# HumanHealing.RequestContext — Authoring Skill

Use this Skill whenever creating or changing the `HumanHealing.RequestContext` artifact.

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

- `INV-HUMAN-001`: the original Intent is immutable.
- `INV-HUMAN-002`: previously proven successful work is preserved.
- `INV-HUMAN-003`: questions request evidence or authorization, never silently delegate responsibility.
- `INV-HUMAN-004`: lack of confidence cannot trigger speculative mutation.

## Forbidden authoring outcomes

- replace the Intent with an easier objective.
- discard the checkpoint.
- ask for data already present.
- grant write authority.
- Do not rename terminal events; they remain `HumanHealing.RequestContext.Ok` and `HumanHealing.RequestContext.Error`.
- Do not mark the proof as proved without independent executable evidence.
