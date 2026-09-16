# Optimization Knowledge Graph

## Purpose

Persist reusable, evidence-backed knowledge about code optimization, impact, invariants, and prior outcomes so CodeHealer does not restart from zero for each Action.

## Local graph families

### Logical Dependency Graph

Represents semantic/data dependencies among Actions and capabilities.

```text
Action A -> depends_on -> Action B
Action A -> reads -> Entity X
Action A -> emits -> Event Y
```

### Usage / Call Graph

Represents where an Action is invoked or relied upon.

```text
Inventory.FindAvailableStock
  -> used_by -> Sales.ValidateOrder
  -> used_by -> Purchase.Reorder
  -> used_by -> Inventory.Reserve
```

### Invariant Graph

Connects Actions and flows to protected properties.

```text
Action -> preserves -> Invariant
Flow   -> requires  -> Invariant
```

### Optimization Knowledge Graph

Stores validated or rejected transformations with context and provenance.

```text
OptimizationPattern
  -> applicable_when -> Context
  -> supported_by    -> Evidence
  -> attempted_on    -> ActionVersion
  -> produced        -> CandidateVersion
  -> validated_by    -> Experiment
  -> outcome         -> Promoted | Rejected
```

## Core node types

- Action
- ActionVersion
- SemanticContract
- Invariant
- Entity
- Event
- Flow
- OptimizationFinding
- OptimizationPattern
- ExternalEvidence
- Experiment
- MetricWindow
- Candidate
- Promotion
- Rejection

## Impact-directed testing

For Action `A`, define:

```text
Impact(A) = descendants(A, UsageGraph ∪ DependencyGraph)
```

The first validation set is derived from `Impact(A)` plus all invariants reachable from those nodes. Whole-system validation may still follow, but targeted testing is performed first for fast rejection and causal attribution.

## Provenance rules

Every optimization edge must retain:

```text
source_hash
candidate_hash
contract_hash
analyzer_version
evidence_hashes[]
experiment_ids[]
metrics_before
metrics_after
decision
```

Rejected candidates remain valuable knowledge and must not be erased; they prevent repeated dead ends.

## Query examples

```text
find patterns previously promoted for Zig Actions with:
  - hot linear scans
  - read-only semantics
  - stable key domain
```

```text
find all invariants and dependent flows affected by Action X
```

```text
find transformations rejected because they increased memory > configured limit
```

## Learning boundary

The graph is initially a deterministic knowledge/provenance store. GNN-based embeddings or learned recommendation layers are optional later projections and are not required for correctness.
