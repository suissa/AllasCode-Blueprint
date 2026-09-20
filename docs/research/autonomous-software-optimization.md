# Autonomous Software Optimization — Research Basis

Status: research/specification source

## Thesis

AllasCode treats software optimization as a closed-loop, evidence-driven process over atomic Actions. The system must not optimize code speculatively. It may only open an optimization cycle when objective telemetry proves that an Action violates an explicit operational limit or SLO, such as CPU time, p99 latency, memory, allocation rate, I/O cost, or error budget.

The architectural separation is strict:

- **CodeManager** owns the semantic contract: what the Action means, inputs, outputs, pre/post-conditions, invariants, permitted side effects, forbidden side effects, and error semantics.
- **CodeHealer** owns code correction/optimization: how the same contract can be implemented better in the target language.
- **SystemHealer** owns runtime/configuration correction: worker counts, pools, limits, timeouts, backpressure, infrastructure and core configuration. It must not rewrite Action implementation.

This separation prevents the optimization agent from redefining business semantics while trying to improve performance.

## Core research loop

```text
telemetry
  -> performance.violation.detected
  -> deterministic language analysis
  -> semantic contract reconstruction
  -> local optimization knowledge lookup
  -> external evidence lookup on miss
  -> semantic pseudocode candidate
  -> implementation candidate
  -> clone/replay validation
  -> regression/load/stress/chaos/security/benchmark gates
  -> canary
  -> promotion or rejection
  -> provenance graph update
```

## Why this differs from blind rollout search

The proposed loop narrows the search space before code generation. Instead of repeatedly attempting arbitrary patches until something passes, it uses:

1. a semantic contract that is immutable for the optimization cycle;
2. a deterministic language-specific analyzer;
3. an impact graph that identifies where the Action is used;
4. an invariant graph that enumerates what must remain true;
5. an optimization knowledge graph that stores previously validated transformations;
6. source-grounded external evidence when no local pattern applies;
7. counterfactual replay against historical states before promotion.

The LLM is therefore a constrained synthesis component, not the authority for language semantics or acceptance.

## Zig optimization analyzer

The Zig tooling must be version-aware and deterministic. Findings are facts or hypotheses produced from syntax/AST/IR/runtime profiles, not free-form LLM suggestions. Initial finding classes:

- allocations and repeated allocations;
- unnecessary copies;
- loop and traversal costs;
- algorithmic complexity;
- syscalls and I/O strategy;
- locking/contention;
- branch-heavy hot paths;
- data layout and cache locality;
- comptime opportunities;
- SIMD/vectorization opportunities;
- bounds checks and repeated validation;
- hash/index/search strategy;
- serialization/deserialization overhead;
- repeated parsing or format conversion.

The analyzer must emit structured evidence including Action ID, symbol, metric violation, source span, rule ID, confidence class, and allowed optimization classes.

## Semantic pseudocode before Zig

Before generating a candidate implementation, CodeHealer must express the current and proposed behavior in a language-neutral semantic form. Required fields:

```text
Action
Inputs
Outputs
Requires
Ensures
Reads
Writes
AllowedSideEffects
ForbiddenSideEffects
ErrorSemantics
Determinism
Idempotency
Invariants
```

The candidate is rejected before compilation if it changes a protected semantic property.

## Evidence-grounded optimization

CodeHealer checks the local Optimization Knowledge Graph first. On miss, it may search public repositories and technical sources. External evidence must be recorded with provenance:

```text
repository
commit
file/symbol
language_version
optimization_pattern
preconditions
semantic_assumptions
benchmark_evidence
license
retrieved_at
content_hash
```

External code is never copied blindly. The transformation principle is extracted, applicability is checked, and a new candidate is synthesized under the local contract and license constraints.

## Counterfactual clone

The clone server is a branchable experimental environment reconstructed from Event Sourcing. Historical production state is restored from snapshot + forward replay to an exact offset. Candidate code is then evaluated against the same historical states and alternative perturbations.

Each experimental branch records:

```text
branch_id
parent_offset
state_hash
candidate_hash
perturbations[]
observed_events[]
metrics_before
metrics_after
invariant_results
security_results
outcome
```

The clone can run deterministic regression, load, stress, chaos, security, and benchmark suites without mutating production.

## Promotion rule

A candidate may be promoted only when all mandatory gates pass:

```text
Promote(C) iff
  SemanticEquivalent(C)
  AND AllInvariants(C)
  AND NoFunctionalRegression(C)
  AND PerformanceImprovement(C)
  AND SecurityNonDegradation(C)
  AND ResourceConstraintsSatisfied(C)
```

Performance improvement must be measured statistically across repeated comparable runs; a single faster run is insufficient.

## Graphs

Four local graphs support the process:

1. **Logical Dependency Graph** — what depends on what.
2. **Usage/Call Graph** — where each Action is invoked.
3. **Invariant Graph** — which invariants constrain each Action and dependent flow.
4. **Optimization Knowledge Graph** — which transformations were attempted, under which contexts, with what results.

These graphs enable impact-directed testing instead of indiscriminate whole-system testing as the first step.

## Event sequence

```text
performance.violation.detected
optimization.analysis.completed
optimization.evidence.found
semantic.pseudocode.generated
optimization.candidate.created
optimization.candidate.validated | optimization.candidate.rejected
optimization.candidate.canary_started
optimization.candidate.promoted | optimization.candidate.rolled_back
```

Every event must carry correlation/causation IDs, Action identity, implementation hash, contract hash, analyzer version, evidence hashes, and metrics.

## Research hypotheses

- H1: contract-constrained, evidence-grounded repair requires fewer candidate evaluations than unconstrained patch generation for the same class of performance defects.
- H2: impact-directed testing reduces validation cost without increasing escaped regressions.
- H3: historical Event Sourcing replay detects regressions that unit tests alone miss.
- H4: a local Optimization Knowledge Graph reduces external search and candidate generation cost over time.
- H5: contextual bandits can improve experiment selection in the clone before full RL is justified.

## Implementation order

Do not start with GNN, RL, blockchain, or marketplace logic. Validate the deterministic loop first:

1. Action contracts + telemetry.
2. Zig deterministic analyzer.
3. dependency/usage/invariant graphs.
4. evidence-grounded CodeHealer.
5. clone snapshot/replay.
6. promotion gates + canary + rollback.
7. contextual bandit for experiment selection.
8. only then consider RL/GNN/global knowledge layers.
