# Zig Optimization Analyzer

## Purpose

Provide deterministic, version-aware analysis of Zig Action implementations before any LLM-based optimization planning occurs.

The analyzer is an authority for structural/runtime findings, not for business semantics.

## Inputs

```text
zig_version
action_id
implementation_path
source_hash
profile_window
runtime_metrics
semantic_contract_hash
```

## Initial rule families

- repeated allocations and allocator churn
- unnecessary copies/moves
- repeated parsing/serialization
- linear scans on hot paths
- nested loops and avoidable complexity
- syscall frequency
- blocking I/O in hot paths
- lock contention / shared-state pressure
- branch-heavy hot code
- poor data locality / layout
- avoidable bounds/validation repetition
- hash/index lookup opportunities
- comptime specialization opportunities
- SIMD/vectorization candidates
- avoidable temporary buffers
- repeated format conversion

## Finding schema

```text
OptimizationFinding
  finding_id
  rule_id
  zig_version
  action_id
  symbol
  source_span
  metric
  observed_value
  configured_limit
  evidence_kind
  evidence
  optimization_classes[]
  confidence
  analyzer_version
  source_hash
```

## Constraints

1. A rule must be deterministic for the same source/profile input.
2. The analyzer must never rewrite code.
3. A finding does not authorize a change; it only narrows the search space.
4. Rules must be versioned with Zig semantics.
5. Unsupported or ambiguous language constructs must yield `inconclusive`, not speculative advice.
6. Runtime profile evidence and static evidence must be distinguishable.

## Example

```text
finding_id: F-128
rule_id: ZIG-HOT-LINEAR-SCAN-001
action_id: Inventory.FindAvailableStock
symbol: findAvailableStock
metric: cpu_time_p99
observed_value: 8.1ms
configured_limit: 4ms
evidence_kind: profile+ast
optimization_classes:
  - indexing
  - search_strategy
confidence: high
```

## Output consumers

- CodeManager uses the finding only as problem evidence.
- CodeHealer uses it to constrain applicable transformation classes.
- Clone validation uses the original metric/limit as part of the promotion benchmark.
