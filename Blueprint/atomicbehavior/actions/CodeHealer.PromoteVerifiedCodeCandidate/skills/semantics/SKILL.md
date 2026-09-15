---
name: CodeHealer.PromoteVerifiedCodeCandidate.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and retrieval signals of CodeHealer.PromoteVerifiedCodeCandidate."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeHealer.PromoteVerifiedCodeCandidate
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeHealer.PromoteVerifiedCodeCandidate — Semantics Skill

Load this Skill when the canonical label, one of its semantic types, an event label, an authority mode, or an invariant identifier appears in context.

## Meaning

Promote one independently verified code candidate after an explicit approval gate.

## Inputs

- candidate: CandidateArtifact
- candidate_hash: ContentHash
- verification: VerificationResult
- verification_evidence_hash: EvidenceHash
- approval_ref: ApprovalReference
- target_action: ActionIdentity

## Outputs

- promotion_id: PromotionId
- promoted_hash: ContentHash
- target_action: ActionIdentity
- promoter_actor_id: ActorIdentity
- created_at: Timestamp

## Invariants

- INV-PROMOTECODE-001: configuration and contracts remain read-only.
- INV-PROMOTECODE-002: promotion requires independent verification and approval.
- INV-PROMOTECODE-003: the promoted content equals the verified candidate byte-for-byte.

An Error preserves the original Intent, exposes only safe diagnostics, and routes unresolved work to Human-in-the-Healing-Loop. This Action cannot broaden its authority or silently substitute another causal dimension.
