# CodeKnowledge.PublishHealingCase

Convert a completed healing experiment into versioned positive or negative causal knowledge with verifiable provenance.

## Authority

- Actor role: `CodeKnowledgeAgent`
- Mode: `bounded_knowledge_write`
- Reads: HealingHypothesis, CandidateArtifact, VerificationResult, runtime evidence
- Writes: `knowledge/healing-cases/**`, `generated/skills/healing-cases/**`

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `CodeKnowledge.PublishHealingCase.Ok` or `CodeKnowledge.PublishHealingCase.Error`.

## Semantic contract

Preconditions:

- `all_provenance_hashes_are_valid`
- `verification_disposition_is_final`

Invariants:

- **INV-CASE-001:** only independently supported cases may be replay-eligible.
- **INV-CASE-002:** falsified cases remain negative knowledge that prevents repeated failed interventions.
- **INV-CASE-003:** inconclusive cases cannot authorize autonomous mutation.
- **INV-CASE-004:** the case records versions, evidence, mechanism, intervention, predictions, effects, regressions, and disposition.

It must never:

- erase failed experiments.
- generalize beyond recorded compatibility constraints.
- publish unsigned external content as trusted.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
