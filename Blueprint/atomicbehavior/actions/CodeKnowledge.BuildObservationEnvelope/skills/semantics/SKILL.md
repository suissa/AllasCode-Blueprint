---
name: CodeKnowledge.BuildObservationEnvelope.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of CodeKnowledge.BuildObservationEnvelope."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeKnowledge.BuildObservationEnvelope
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeKnowledge.BuildObservationEnvelope — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `CodeKnowledge.BuildObservationEnvelope`.

## Meaning

Build a content-addressed, provenance-preserving envelope from the complete failed Intent execution.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `execution_id`: `ExecutionId`
- `intent`: `IntentDescriptor`
- `actions`: `ActionDescriptorList`
- `events`: `EventEvidenceList`
- `metrics`: `MetricEvidenceMap`
- `traces`: `TraceEvidenceList`
- `logs`: `LogEvidenceList`
- `error`: `ErrorObservation`

## Outputs

- `observation_envelope`: `ObservationEnvelope`
- `evidence_hash`: `EvidenceHash`
- `missing_evidence`: `EvidenceGapList`
- `provenance`: `EvidenceProvenance`

## Invariants

- `INV-OBS-001`: no evidence may be invented, repaired, or normalized into a different claim.
- `INV-OBS-002`: source, timestamp, execution, correlation, and causation provenance are preserved.
- `INV-OBS-003`: canonical serialization of identical evidence produces the same evidence hash.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot infer a root cause.
- It cannot mutate code or configuration.
- It cannot erase contradictory evidence.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
