---
name: CodeManager.CreateHealingHypothesis.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of CodeManager.CreateHealingHypothesis."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeManager.CreateHealingHypothesis
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeManager.CreateHealingHypothesis — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `CodeManager.CreateHealingHypothesis`.

## Meaning

Create an immutable, falsifiable healing hypothesis before any code or configuration mutation.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `observation_envelope`: `ObservationEnvelope`
- `artifact_resolution`: `ArtifactResolution`
- `skill_bundle`: `SkillBundle`
- `allowed_fault_classes`: `FaultClassSet`

## Outputs

- `hypothesis`: `HealingHypothesis`
- `hypothesis_hash`: `HypothesisHash`
- `fault_class`: `FaultClass`
- `mutation_scope`: `MutationScope`
- `falsification_criteria`: `FalsificationCriterionList`

## Invariants

- `INV-HYP-001`: the CodeManager has no mutation authority.
- `INV-HYP-002`: fault class is exactly code, system, or unknown.
- `INV-HYP-003`: every hypothesis states supporting evidence, contrary or missing evidence, alternatives, predictions, and falsification criteria.
- `INV-HYP-004`: known verified cases are contextual priors, never unconditional commands.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot request simultaneous code and config mutation in one experiment.
- It cannot derive cause only from the final error.
- It cannot write a candidate.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
