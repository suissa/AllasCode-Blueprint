# Semantic Equivalence

## Goal

Prevent a performance or repair candidate from changing the meaning of an Action while attempting to improve its implementation.

## Contract model

For an Action `A`, let `C(A)` be the frozen semantic contract and `I0`, `I1` the original and candidate implementations.

The target property is not unrestricted program equivalence. It is contract-relative equivalence:

```text
SemanticEquivalent(I0, I1 | C)
```

meaning both implementations satisfy the same externally observable behavior required by `C` over the supported input/state domain.

## Mandatory dimensions

- input acceptance/rejection
- output meaning and schema
- preconditions
- postconditions
- reads/writes
- permitted side effects
- forbidden side effects
- error semantics
- determinism requirements
- idempotency requirements
- ordering guarantees when specified
- invariants

## Validation layers

No single method is sufficient. Validation combines:

1. structural contract comparison;
2. static checks where available;
3. unit tests;
4. property-based/invariant tests;
5. differential execution old vs candidate;
6. historical Event Sourcing replay;
7. targeted impact tests from usage/dependency graphs;
8. runtime assertions in clone/canary.

## Required decision states

```text
Equivalent
NotEquivalent
Inconclusive
```

`Inconclusive` must block automatic promotion. Lack of proof is not treated as equivalence.

## Differential rule

For deterministic Actions over a replayable state/input set `T`:

```text
forall t in T:
  observable(I0, t) == observable(I1, t)
```

Observed values include declared outputs and all contract-visible state transitions, not merely return values.

## Promotion condition

Semantic equivalence is necessary but not sufficient:

```text
Promote(Candidate) iff
  SemanticEquivalent == Equivalent
  AND AllInvariants == true
  AND FunctionalRegression == false
  AND PerformanceImprovement == statistically_supported
  AND SecurityNonDegradation == true
  AND ResourceConstraintsSatisfied == true
```

## Limitations

Complete semantic equivalence is undecidable in the general case. The architecture therefore requires explicit contracts, bounded supported domains where possible, deterministic replay, differential testing, and an `Inconclusive` state rather than pretending to prove what the system cannot prove.
