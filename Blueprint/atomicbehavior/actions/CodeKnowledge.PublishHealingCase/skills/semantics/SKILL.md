---
name: CodeKnowledge.PublishHealingCase.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of CodeKnowledge.PublishHealingCase."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.PublishHealingCase
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeKnowledge.PublishHealingCase — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `CodeKnowledge.PublishHealingCase`.

## Meaning

Convert a completed healing experiment into versioned positive or negative causal knowledge with verifiable provenance.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `hypothesis`: `HealingHypothesis`
- `candidate`: `CandidateArtifact`
- `verification`: `VerificationResult`
- `context_constraints`: `CompatibilityConstraintSet`

## Outputs

- `healing_case_skill`: `HealingCaseSkill`
- `index_record`: `SkillIndexRecord`
- `knowledge_hash`: `ContentHash`
- `replay_eligible`: `Boolean`

## Invariants

- `INV-CASE-001`: only independently supported cases may be replay-eligible.
- `INV-CASE-002`: falsified cases remain negative knowledge that prevents repeated failed interventions.
- `INV-CASE-003`: inconclusive cases cannot authorize autonomous mutation.
- `INV-CASE-004`: the case records versions, evidence, mechanism, intervention, predictions, effects, regressions, and disposition.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot erase failed experiments.
- It cannot generalize beyond recorded compatibility constraints.
- It cannot publish unsigned external content as trusted.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
