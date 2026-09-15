---
name: HumanHealing.RequestContext.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of HumanHealing.RequestContext."
version: 0.1.0
author: AllasCode
always: false
canonical_label: HumanHealing.RequestContext
skill_type: semantics
source_manifest: ../../manifest.yml
---

# HumanHealing.RequestContext — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `HumanHealing.RequestContext`.

## Meaning

Request the minimum human evidence needed when automatic healing cannot preserve the original Intent with adequate confidence.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `intent_id`: `IntentId`
- `execution_id`: `ExecutionId`
- `evidence_gaps`: `EvidenceGapList`
- `questions`: `HumanQuestionList`
- `checkpoint`: `ExecutionCheckpoint`

## Outputs

- `request_id`: `RequestId`
- `continuation_token`: `ContinuationToken`
- `preserved_state_hash`: `ContentHash`
- `status`: `HumanHealingStatus`

## Invariants

- `INV-HUMAN-001`: the original Intent is immutable.
- `INV-HUMAN-002`: previously proven successful work is preserved.
- `INV-HUMAN-003`: questions request evidence or authorization, never silently delegate responsibility.
- `INV-HUMAN-004`: lack of confidence cannot trigger speculative mutation.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot replace the Intent with an easier objective.
- It cannot discard the checkpoint.
- It cannot ask for data already present.
- It cannot grant write authority.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
