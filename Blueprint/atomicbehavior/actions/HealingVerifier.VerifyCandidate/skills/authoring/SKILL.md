---
name: HealingVerifier.VerifyCandidate.authoring
description: "Create, modify, and test the HealingVerifier.VerifyCandidate AtomicBehavior without violating its authority boundary."
version: 0.1.0
author: AllasCode
always: false
canonical_label: HealingVerifier.VerifyCandidate
skill_type: authoring
source_manifest: ../../manifest.yml
---

# HealingVerifier.VerifyCandidate — Authoring Skill

Use this Skill whenever creating or changing the `HealingVerifier.VerifyCandidate` artifact.

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

- `INV-VERIFY-001`: the proposing Agent cannot verify or promote its own candidate.
- `INV-VERIFY-002`: visible test success alone is insufficient.
- `INV-VERIFY-003`: all original Intent invariants and hidden acceptance obligations remain authoritative.
- `INV-VERIFY-004`: inconclusive evidence never becomes supported.

## Forbidden authoring outcomes

- mutate the candidate.
- change the hypothesis after observing results.
- hide failed tests.
- promote directly.
- Do not rename terminal events; they remain `HealingVerifier.VerifyCandidate.Ok` and `HealingVerifier.VerifyCandidate.Error`.
- Do not mark the proof as proved without independent executable evidence.
