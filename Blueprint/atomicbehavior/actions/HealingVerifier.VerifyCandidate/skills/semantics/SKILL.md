---
name: HealingVerifier.VerifyCandidate.semantics
description: "Understand the purpose, causal role, inputs, outputs, invariants, and prohibitions of HealingVerifier.VerifyCandidate."
version: 0.1.0
author: AllasCode
always: false
canonical_label: HealingVerifier.VerifyCandidate
skill_type: semantics
source_manifest: ../../manifest.yml
---

# HealingVerifier.VerifyCandidate — Semantics Skill

Use this Skill whenever code, configuration, an event, log, metric, trace, error message, or another artifact refers to `HealingVerifier.VerifyCandidate`.

## Meaning

Independently compare predicted and observed candidate behavior and classify the healing experiment.

## Causal position

The Action listens to one request injected at Actor creation, evaluates its declared preconditions and authority, produces a content-addressed result, and emits exactly one fixed terminal event.

## Inputs

- `hypothesis`: `HealingHypothesis`
- `candidate`: `CandidateArtifact`
- `predicted_effects`: `PredictedEffectList`
- `verification_plan`: `VerificationPlan`

## Outputs

- `disposition`: `VerificationDisposition`
- `observed_effects`: `ObservedEffectList`
- `evidence_hash`: `EvidenceHash`
- `failed_invariants`: `InvariantViolationList`

## Invariants

- `INV-VERIFY-001`: the proposing Agent cannot verify or promote its own candidate.
- `INV-VERIFY-002`: visible test success alone is insufficient.
- `INV-VERIFY-003`: all original Intent invariants and hidden acceptance obligations remain authoritative.
- `INV-VERIFY-004`: inconclusive evidence never becomes supported.

## Retrieval signals

Load this Skill when the canonical label, one of its input/output semantic types, its event labels, its authority mode, or one of its invariant identifiers appears in the observed context.

## What this Action cannot mean

- It cannot mutate the candidate.
- It cannot change the hypothesis after observing results.
- It cannot hide failed tests.
- It cannot promote directly.

An `Error` result preserves the original Intent and routes unresolved execution toward Human-in-the-Healing-Loop; it does not authorize a weaker Intent.
