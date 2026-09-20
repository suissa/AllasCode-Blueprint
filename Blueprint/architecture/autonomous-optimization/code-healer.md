# CodeHealer

## Responsibility

CodeHealer owns source-level correction and optimization while preserving the frozen semantic contract supplied by CodeManager.

It may change implementation details but must not change Action intent, I/O meaning, invariants, or externally observable behavior except where the contract explicitly allows nondeterminism or implementation-dependent behavior.

## Allowed mutation surface

Canonical optimization target:

```text
implementation.zig
```

Other authoritative specifications remain read-only unless another agent owns them.

## Decision sequence

```text
performance.violation.detected
  -> receive SemanticContract
  -> receive deterministic analyzer findings
  -> resolve impact/invariant graphs
  -> search local Optimization Knowledge Graph
  -> if miss: retrieve external technical evidence
  -> derive optimization principle
  -> verify applicability
  -> generate semantic pseudocode candidate
  -> generate Zig candidate
  -> submit to clone validation
```

## Evidence rule

CodeHealer must not invent an optimization solely from unconstrained model reasoning. Each transformation must be grounded in either:

1. a locally validated optimization pattern; or
2. external technical evidence with verifiable provenance.

External evidence record:

```text
source_repository
commit
file_or_symbol
language_version
pattern
preconditions[]
semantic_assumptions[]
benchmark_evidence
license
retrieved_at
content_hash
```

The system extracts the principle; it does not copy code blindly.

## Semantic pseudocode gate

Before Zig generation, CodeHealer must emit a language-neutral candidate behavior description containing:

```text
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

The candidate is rejected if this representation changes a protected property of the current SemanticContract.

## Optimization examples

Permitted categories may include:

- replacing repeated linear search with an indexed lookup;
- reducing repeated allocation;
- changing data layout for locality;
- reducing copies;
- changing an algorithm with equivalent semantics;
- introducing comptime specialization;
- safe SIMD/vectorization;
- reducing syscalls or serialization work;
- reducing contention.

## Non-responsibilities

CodeHealer does not tune worker count, timeout, pool size, process topology, runtime resource limits, or other core configuration. Those belong to SystemHealer.
