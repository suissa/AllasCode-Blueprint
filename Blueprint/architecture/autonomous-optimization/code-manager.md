# CodeManager

## Responsibility

CodeManager owns the semantic definition of an Action. It does not design optimizations and does not rewrite implementation code.

## Inputs

- Action identity
- intent/behavior specification
- input/output schemas
- invariants and constraints
- dependency/usage graph references
- runtime evidence that triggered analysis

## Outputs

A frozen `SemanticContract` for the optimization cycle:

```text
SemanticContract
  action_id
  intent
  inputs
  outputs
  requires[]
  ensures[]
  reads[]
  writes[]
  allowed_side_effects[]
  forbidden_side_effects[]
  error_semantics
  determinism
  idempotency
  invariants[]
  contract_hash
```

## Rules

1. CodeManager must infer and state the hypothesis/problem before any mutation is attempted.
2. It may clarify an underspecified contract from existing authoritative specifications, but must not weaken invariants to make a candidate pass.
3. It never chooses algorithms, data structures, Zig patterns, or source-level transformations.
4. It provides CodeHealer with the exact semantic boundary the candidate must preserve.
5. The contract hash is attached to every downstream optimization event.

## Failure cases

If the semantic contract is ambiguous or contradictory, optimization stops and the case is escalated rather than guessed.
