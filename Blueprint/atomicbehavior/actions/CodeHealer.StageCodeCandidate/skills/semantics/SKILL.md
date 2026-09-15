---
name: CodeHealer.StageCodeCandidate.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of CodeHealer.StageCodeCandidate."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeHealer.StageCodeCandidate
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeHealer.StageCodeCandidate — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `CodeHealer.StageCodeCandidate`.

## Meaning

Stage the smallest code-only candidate authorized by an immutable code-fault hypothesis.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `hypothesis`: `HealingHypothesis`
- `target_action`: `ActionIdentity`
- `base_hash`: `ContentHash`
- `patch`: `CandidatePatch`

## Outputs

- `candidate_id`: `CandidateId`
- `candidate_hash`: `ContentHash`
- `diff`: `BoundedDiff`
- `requested_tests`: `VerificationPlan`

## Invariants

- `INV-CODESTAGE-001`: contracts, schemas, invariants, specifications, tests, and Git metadata are read-only.
- `INV-CODESTAGE-002`: the original Intent and its version remain unchanged.
- `INV-CODESTAGE-003`: the candidate cannot promote or verify itself.
- `INV-CODESTAGE-004`: the patch is minimal with respect to the declared causal dimension.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot edit tests to make the candidate pass.
- It cannot change configs/core.yml.
- It cannot commit or merge.
- It cannot weaken an invariant.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
