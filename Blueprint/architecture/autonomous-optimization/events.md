# Autonomous Optimization Events

## Envelope

Every event in this subsystem MUST include:

```text
event_id
schema_version
event_type
occurred_at
producer_agent_id
subject_action_id
correlation_id
causation_id
contract_hash
source_hash
payload_hash
branch_id? 
experiment_id?
```

Where applicable, the envelope also carries analyzer version, candidate hash, evidence hashes, runtime version and replay offset.

## Canonical event flow

```text
performance.violation.detected
  -> optimization.analysis.completed
  -> optimization.evidence.found | optimization.evidence.missing
  -> semantic.pseudocode.generated
  -> optimization.candidate.created
  -> optimization.candidate.validated | optimization.candidate.rejected
  -> optimization.candidate.canary_started
  -> optimization.candidate.promoted | optimization.candidate.rolled_back
```

## `performance.violation.detected`

Required payload:

```text
metric
observed_value
configured_limit
window
samples
runtime_context_hash
```

This event is the only normal entry point for automatic performance optimization.

## `optimization.analysis.completed`

Required payload:

```text
analyzer_version
zig_version
findings[]
impact_nodes[]
invariant_ids[]
analysis_hash
```

## `optimization.evidence.found`

Required payload:

```text
evidence_id
source_kind
repository?
commit?
file_or_symbol?
pattern
preconditions[]
semantic_assumptions[]
license
content_hash
```

## `semantic.pseudocode.generated`

Required payload:

```text
original_semantic_hash
candidate_semantic_hash
contract_hash
equivalence_precheck
```

## `optimization.candidate.created`

Required payload:

```text
candidate_id
parent_implementation_hash
candidate_implementation_hash
transformation_pattern_ids[]
evidence_ids[]
```

## `optimization.candidate.validated`

Required payload:

```text
candidate_id
semantic_equivalence
unit_results
invariant_results
differential_results
replay_results
load_results
stress_results
chaos_results
security_results
benchmark_results
promotion_recommendation
```

## `optimization.candidate.rejected`

Required payload:

```text
candidate_id
failed_gate
reason
counterexample?
metrics?
```

Rejected evidence MUST remain in the Optimization Knowledge Graph.

## `optimization.candidate.promoted`

Required payload:

```text
candidate_id
previous_implementation_hash
new_implementation_hash
canary_evidence
metrics_before
metrics_after
rollback_ref
```

## `optimization.candidate.rolled_back`

Required payload:

```text
candidate_id
promoted_hash
restored_hash
triggering_evidence
rollback_completed_at
```

## Delivery semantics

Consumers MUST be idempotent by `event_id`. Event transport may be at-least-once; duplicate delivery MUST NOT duplicate graph edges, payments, version promotions, replay branches, or state transitions.

## Authority

These events describe internal optimization workflow. They do not replace the Runtime-owned canonical Action outcome contract. Public Action `Ok/Error` authority remains with the Runtime.
