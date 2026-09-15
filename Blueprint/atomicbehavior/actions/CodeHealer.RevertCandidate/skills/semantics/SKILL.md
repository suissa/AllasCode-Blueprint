---
name: CodeHealer.RevertCandidate.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and retrieval signals of CodeHealer.RevertCandidate."
version: 0.1.0
author: AllasCode
always: false
canonical_label: CodeHealer.RevertCandidate
skill_type: semantics
source_manifest: ../../manifest.yml
---

# CodeHealer.RevertCandidate — Semantics Skill

Load this Skill when the canonical label, one of its semantic types, an event label, an authority mode, or an invariant identifier appears in context.

## Meaning

Restore the exact pre-candidate code snapshot when rollback is authorized.

## Inputs

- candidate_hash: ContentHash
- target_action: ActionIdentity
- base_hash: ContentHash
- rollback_ref: RollbackReference
- approval_ref: ApprovalReference

## Outputs

- rollback_id: RollbackId
- restored_hash: ContentHash
- target_action: ActionIdentity
- created_at: Timestamp

## Invariants

- INV-REVERT-001: rollback restores the exact base snapshot.
- INV-REVERT-002: configuration and contracts remain read-only.
- INV-REVERT-003: rollback is itself idempotent and content-addressed.

An Error preserves the original Intent, exposes only safe diagnostics, and routes unresolved work to Human-in-the-Healing-Loop. This Action cannot broaden its authority or silently substitute another causal dimension.
