---
name: CodeRuntime.CaptureRuntimeEvidence.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and retrieval signals of CodeRuntime.CaptureRuntimeEvidence."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeRuntime.CaptureRuntimeEvidence
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeRuntime.CaptureRuntimeEvidence — Semantics Skill

Load this Skill when the canonical label, one of its semantic types, an event label, an authority mode, or an invariant identifier appears in context.

## Meaning

Normalize one completed execution's observed streams into provenance-preserving evidence without inferring a cause.

## Inputs

- execution_id: ExecutionId
- streams: RuntimeStreamBundle
- source_metadata: EvidenceSourceMetadata

## Outputs

- evidence_hash: EvidenceHash
- normalized_observations: RuntimeObservationList
- provenance: EvidenceProvenance
- created_at: Timestamp

## Invariants

- INV-CAPTURE-001: no root cause or repair is inferred.
- INV-CAPTURE-002: source timestamps and correlation are preserved.
- INV-CAPTURE-003: identical streams serialize to the same evidence hash.

An Error preserves the original Intent, exposes only safe diagnostics, and routes unresolved work to Human-in-the-Healing-Loop. This Action cannot broaden its authority or silently substitute another causal dimension.
