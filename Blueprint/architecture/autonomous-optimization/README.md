# Autonomous Optimization Architecture

Status: canonical architecture proposal

## Purpose

This subsystem continuously detects, explains, validates, and promotes safe software optimizations without allowing optimization logic to redefine Action semantics.

## Authority boundaries

```text
CodeManager  -> owns semantic contract
CodeHealer   -> owns implementation repair/optimization
SystemHealer -> owns configuration/runtime healing
Runtime      -> owns execution and public Ok/Error authority
Clone        -> owns isolated validation environment
```

No component may cross these boundaries implicitly.

## Trigger rule

Optimization is event-driven and threshold-gated. A code optimization cycle starts only after an objective Action-level violation such as:

```text
cpu_time > cpu_limit
p99_latency > latency_slo
memory_peak > memory_limit
allocation_rate > allocation_limit
io_wait > io_wait_limit
```

No violation means no optimization attempt.

## Canonical flow

```text
Action telemetry
  -> violation detection
  -> deterministic Zig analysis
  -> CodeManager semantic contract resolution
  -> impact/invariant graph resolution
  -> CodeHealer evidence lookup
  -> semantic pseudocode proposal
  -> candidate implementation
  -> clone replay and validation
  -> canary
  -> promote or rollback
  -> append provenance events
```

## Mandatory invariants

1. The semantic contract is immutable during an optimization cycle.
2. CodeHealer may modify implementation only.
3. SystemHealer may modify approved configuration only.
4. Every candidate must be reproducible from evidence and recorded inputs.
5. Every candidate must preserve declared invariants.
6. Historical replay must be deterministic for deterministic Actions.
7. External evidence must preserve provenance and license metadata.
8. Production promotion requires all gates to pass.
9. Rollback must be possible from the promoted version lineage.
10. The Runtime remains the authority that executes Actions and emits canonical public outcomes.

## Components

- `code-manager.md`
- `code-healer.md`
- `system-healer.md`
- `zig-optimization-analyzer.md`
- `semantic-equivalence.md`
- `optimization-knowledge-graph.md`
- `clone-server.md`
- `events.md`

## Maturity

The deterministic contract/analyzer/replay loop is the required first implementation. Contextual bandits, RL, GNN, public graph anchoring, and economic mechanisms are later research layers and must not be prerequisites for the first production-capable loop.
