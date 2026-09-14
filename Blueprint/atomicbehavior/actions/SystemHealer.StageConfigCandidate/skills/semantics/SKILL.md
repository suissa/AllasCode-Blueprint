---
name: SystemHealer.StageConfigCandidate.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of SystemHealer.StageConfigCandidate."
version: 0.1.0
author: AllasCode
always: false
canonical_label: SystemHealer.StageConfigCandidate
skill_type: semantics
source_manifest: ../../manifest.yml
---

# SystemHealer.StageConfigCandidate — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `SystemHealer.StageConfigCandidate`.

## Meaning

Stage a bounded system-configuration intervention authorized by an immutable system-fault hypothesis.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `hypothesis`: `HealingHypothesis`
- `config_path`: `ConfigPath`
- `base_hash`: `ContentHash`
- `current_value`: `SemanticValue`
- `candidate_value`: `SemanticValue`

## Outputs

- `candidate_id`: `CandidateId`
- `candidate_hash`: `ContentHash`
- `config_diff`: `BoundedConfigDiff`
- `requested_tests`: `VerificationPlan`

## Invariants

- `INV-CONFSTAGE-001`: only configs/core.yml and only an authorized healable property may change.
- `INV-CONFSTAGE-002`: Action implementations and semantic contracts are read-only.
- `INV-CONFSTAGE-003`: one causal configuration dimension changes per experiment whenever operationally safe.
- `INV-CONFSTAGE-004`: the candidate cannot promote or verify itself.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot modify code.
- It cannot change immutable or operator-only properties.
- It cannot change multiple unrelated settings.
- It cannot commit or merge.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
