---
name: CodeRuntime.ExecuteVerificationPlan.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and retrieval signals of CodeRuntime.ExecuteVerificationPlan."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeRuntime.ExecuteVerificationPlan
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeRuntime.ExecuteVerificationPlan — Semantics Skill

Load this Skill when the canonical label, one of its semantic types, an event label, an authority mode, or an invariant identifier appears in context.

## Meaning

Execute a bounded verification plan against an isolated candidate and return content-addressed runtime evidence.

## Inputs

- candidate: CandidateArtifact
- candidate_hash: ContentHash
- verification_plan: VerificationPlan
- environment_snapshot_hash: ContentHash
- budget: ExecutionBudget

## Outputs

- run_id: VerificationRunId
- candidate_hash: ContentHash
- exit_status: VerificationExitStatus
- evidence_hash: EvidenceHash
- observations: RuntimeObservationList
- created_at: Timestamp

## Invariants

- INV-RUN-001: verification executes without production writes or network authority.
- INV-RUN-002: candidate hash and environment snapshot hash are preserved.
- INV-RUN-003: a timeout is evidence, not a successful verification.

An Error preserves the original Intent, exposes only safe diagnostics, and routes unresolved work to Human-in-the-Healing-Loop. This Action cannot broaden its authority or silently substitute another causal dimension.
