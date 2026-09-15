---
name: CodeKnowledge.ResolveSkill.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of CodeKnowledge.ResolveSkill."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.ResolveSkill
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeKnowledge.ResolveSkill — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `CodeKnowledge.ResolveSkill`.

## Meaning

Retrieve the smallest trusted bundle of authoring, semantic, protocol, language, and verified healing Skills required by the current context.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `observation_envelope`: `ObservationEnvelope`
- `artifact_resolution`: `ArtifactResolution`
- `query_mode`: `SkillQueryMode`
- `maximum_bundle_size`: `PositiveInteger`

## Outputs

- `skill_bundle`: `SkillBundle`
- `retrieval_trace`: `SkillRetrievalTrace`
- `disposition`: `ResolutionDisposition`
- `unmet_dependencies`: `SkillDependencyList`

## Invariants

- `INV-SKRES-001`: hard compatibility and trust gates precede lexical, semantic, and topological ranking.
- `INV-SKRES-002`: retrieval cannot expand mutation authority or writable scope.
- `INV-SKRES-003`: exact fingerprints outrank semantic resemblance when both are compatible.
- `INV-SKRES-004`: only the minimum dependency-closed bundle enters context.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot load every known Skill.
- It cannot auto-install external Skills.
- It cannot treat similarity as causal proof.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
