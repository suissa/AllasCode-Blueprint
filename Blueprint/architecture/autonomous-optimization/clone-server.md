# Counterfactual Clone Server

## Purpose

Provide an isolated, replayable environment where historical production states can be reconstructed and alternative code/configuration candidates can be tested without mutating production.

## State reconstruction

The clone starts from Event Sourcing state, not from an ad hoc test fixture:

```text
snapshot_k + replay(events[k+1..t]) -> State@t
```

The clone never rewinds by mutating state backward. It reconstructs the desired historical point from a prior snapshot and forward replay.

## Branch model

Each experiment creates an independent branch:

```text
ExperimentBranch
  branch_id
  parent_stream
  parent_offset
  parent_state_hash
  candidate_hash
  contract_hash
  perturbations[]
  started_at
  completed_at
  outcome
```

Branches may derive from production checkpoints or from prior experimental branches when compound exploration is explicitly requested.

## Validation suites

Candidate validation order:

1. compile/build checks;
2. semantic-contract checks;
3. unit tests;
4. invariant/property tests;
5. differential old-vs-candidate execution;
6. historical replay;
7. impact-directed integration tests;
8. load tests;
9. stress tests;
10. chaos tests;
11. security tests;
12. benchmark repetitions and statistical comparison.

Early deterministic failures stop the expensive stages.

## Chaos and counterfactual exploration

The clone may inject controlled perturbations such as:

- latency and packet delay/loss;
- duplicate/delayed events;
- pod/process termination;
- CPU/memory pressure;
- storage slowdown;
- dependency outage;
- queue growth/backpressure;
- configuration perturbation;
- increased request/event load.

The goal is not merely to break the system. Experiments must be reproducible and tied to a hypothesis, coverage objective, or learned exploration policy.

## Scheduling

Heavy exploration is scheduled using available headroom rather than a fixed clock time alone. Historical windows may be scanned cheaply first and expensive experiments focused on high-risk or underexplored states.

## Exploration maturity

Initial selection is deterministic/rule-based. Later phases may add:

```text
random baseline
-> multi-armed bandit
-> contextual bandit
-> combinatorial bandit
-> RL for sequential interventions
```

RL is justified only when experiment value depends materially on state transitions created by previous interventions.

## Safety invariants

1. Clone writes never propagate to production state.
2. Production secrets are not copied unless explicitly required and isolated; semantic/masked snapshots are preferred.
3. Every perturbation is logged and reproducible.
4. Candidate artifacts are content-addressed.
5. A failed or inconclusive experiment cannot trigger production promotion.
