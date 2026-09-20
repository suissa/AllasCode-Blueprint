---
name: CodeKnowledge.ResolveArtifact.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of CodeKnowledge.ResolveArtifact."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.ResolveArtifact
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeKnowledge.ResolveArtifact — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `CodeKnowledge.ResolveArtifact`.

## Meaning

Resolve code and observability signals to versioned canonical artifacts without guessing under ambiguity.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `observation_envelope`: `ObservationEnvelope`
- `candidate_scope`: `OptionalArtifactScope`
- `minimum_confidence`: `ConfidenceThreshold`

## Outputs

- `candidates`: `ArtifactResolutionList`
- `selected`: `OptionalArtifactIdentity`
- `disposition`: `ResolutionDisposition`
- `match_explanation`: `RetrievalTrace`

## Invariants

- `INV-ARTRES-001`: version, language, artifact kind, and canonical identity filters run before similarity ranking.
- `INV-ARTRES-002`: confidence below threshold yields ambiguous or unknown, never an invented identity.
- `INV-ARTRES-003`: the resolver is read-only and cannot change the evidence it ranks.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot select only from terminal error text.
- It cannot hide contradictory candidates.
- It cannot grant capabilities.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
