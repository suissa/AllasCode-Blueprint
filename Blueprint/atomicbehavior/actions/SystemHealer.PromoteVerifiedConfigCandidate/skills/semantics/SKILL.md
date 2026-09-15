---
name: SystemHealer.PromoteVerifiedConfigCandidate.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and retrieval signals of SystemHealer.PromoteVerifiedConfigCandidate."
version: 0.1.0
author: AllasCode
always: false
canonical_label: SystemHealer.PromoteVerifiedConfigCandidate
skill_type: semantics
source_manifest: ../../manifest.yml
---

# SystemHealer.PromoteVerifiedConfigCandidate — Semantics Skill

Load this Skill when the canonical label, one of its semantic types, an event label, an authority mode, or an invariant identifier appears in context.

## Meaning

Promote one independently verified configuration candidate after an explicit approval gate.

## Inputs

- candidate: CandidateArtifact
- candidate_hash: ContentHash
- verification: VerificationResult
- verification_evidence_hash: EvidenceHash
- approval_ref: ApprovalReference
- config_path: ConfigPath

## Outputs

- promotion_id: PromotionId
- promoted_hash: ContentHash
- config_path: ConfigPath
- promoter_actor_id: ActorIdentity
- created_at: Timestamp

## Invariants

- INV-PROMOTECONFIG-001: code and contracts remain read-only.
- INV-PROMOTECONFIG-002: promotion requires independent verification and approval.
- INV-PROMOTECONFIG-003: the promoted value equals the verified candidate value.

An Error preserves the original Intent, exposes only safe diagnostics, and routes unresolved work to Human-in-the-Healing-Loop. This Action cannot broaden its authority or silently substitute another causal dimension.
