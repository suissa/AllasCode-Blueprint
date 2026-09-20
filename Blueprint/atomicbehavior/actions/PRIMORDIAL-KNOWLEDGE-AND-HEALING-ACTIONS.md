# Primordial Knowledge and Healing Actions

This catalog defines the first platform Actions required to turn AllasCode artifacts and verified healing experience into atomically retrievable, capability-bounded knowledge.

| Order | Action | Responsibility | Mutation authority |
|---:|---|---|---|
| 1 | [CodeKnowledge.BuildObservationEnvelope](CodeKnowledge.BuildObservationEnvelope/README.md) | Build a content-addressed, provenance-preserving envelope from the complete failed Intent execution. | None |
| 2 | [CodeKnowledge.ResolveArtifact](CodeKnowledge.ResolveArtifact/README.md) | Resolve code and observability signals to versioned canonical artifacts without guessing under ambiguity. | None |
| 3 | [CodeKnowledge.ResolveSkill](CodeKnowledge.ResolveSkill/README.md) | Retrieve the smallest trusted bundle of authoring, semantic, protocol, language, and verified healing Skills required by the current context. | None |
| 4 | [CodeKnowledge.CompileArtifactSkills](CodeKnowledge.CompileArtifactSkills/README.md) | Compile each canonical artifact into exactly one authoring Skill and one semantic Skill derived from the same versioned sources. | generated/skills/<canonical_label>/authoring/**<br>generated/skills/<canonical_label>/semantics/** |
| 5 | [CodeManager.CreateHealingHypothesis](CodeManager.CreateHealingHypothesis/README.md) | Create an immutable, falsifiable healing hypothesis before any code or configuration mutation. | None |
| 6 | [CodeHealer.StageCodeCandidate](CodeHealer.StageCodeCandidate/README.md) | Stage the smallest code-only candidate authorized by an immutable code-fault hypothesis. | <target-action>/implementation/** |
| 7 | [SystemHealer.StageConfigCandidate](SystemHealer.StageConfigCandidate/README.md) | Stage a bounded system-configuration intervention authorized by an immutable system-fault hypothesis. | configs/core.yml#<authorized-healable-property> |
| 8 | [HealingVerifier.VerifyCandidate](HealingVerifier.VerifyCandidate/README.md) | Independently compare predicted and observed candidate behavior and classify the healing experiment. | None |
| 9 | [CodeKnowledge.PublishHealingCase](CodeKnowledge.PublishHealingCase/README.md) | Convert a completed healing experiment into versioned positive or negative causal knowledge with verifiable provenance. | knowledge/healing-cases/**<br>generated/skills/healing-cases/** |
| 10 | [HumanHealing.RequestContext](HumanHealing.RequestContext/README.md) | Request the minimum human evidence needed when automatic healing cannot preserve the original Intent with adequate confidence. | None |

## Canonical flow

```text
BuildObservationEnvelope
  -> ResolveArtifact
  -> ResolveSkill
  -> CreateHealingHypothesis
       -> StageCodeCandidate | StageConfigCandidate | RequestHumanContext
  -> VerifyCandidate
  -> PublishHealingCase
```

`CompileArtifactSkills` runs when a canonical artifact version is created or changed. It compiles exactly two source-linked projections: `authoring` and `semantics`.

## Non-equivalences

```text
NullClaw Tool != AllasCode Action
similarity != causality
Event != Evidence
candidate != accepted artifact
previous healing success != universal command
```

These Actions are version `0.1.0` and maturity `specified`. They become `proved` only after a runtime binding and independent conformance evidence exist.


## Extended runtime and promotion Actions

The first operational loop also includes:

11. CodeRuntime.ExecuteVerificationPlan — Execute a bounded verification plan against an isolated candidate and return content-addressed runtime evidence.
12. CodeRuntime.CaptureRuntimeEvidence — Normalize one completed execution's observed streams into provenance-preserving evidence without inferring a cause.
13. CodeHealer.PromoteVerifiedCodeCandidate — Promote one independently verified code candidate after an explicit approval gate.
14. SystemHealer.PromoteVerifiedConfigCandidate — Promote one independently verified configuration candidate after an explicit approval gate.
15. CodeHealer.RevertCandidate — Restore the exact pre-candidate code snapshot when rollback is authorized.

Promotion is intentionally split between code and configuration authorities. Runtime execution remains sandboxed and evidence capture never infers a cause.
