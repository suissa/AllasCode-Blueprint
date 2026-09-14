# CodeManager Causal Healing Dataset — PoC

This dataset is a proof of concept for training/evaluating the AllasCode `CodeManager` to infer a falsifiable healing thesis from first-occurrence runtime evidence and then ask an implementation model for a causally justified solution.

The dataset assumes no previous occurrence of the failure. The CodeManager receives only evidence available from the current failed Intent execution:

- complete Intent and ordered Action descriptions;
- emitted events;
- metrics;
- traces/spans;
- logs;
- terminal error message;
- declared Action contracts/invariants relevant to the Intent.

The CodeManager MUST NOT edit source code. Its role is epistemic: infer the most plausible causal thesis, identify the suspected Action, state a mechanism, define falsification conditions, and create a bounded request for a solution.

The implementation model (CodeHealer/LLM) MUST answer by explicitly linking:

1. observed evidence;
2. inferred causal mechanism;
3. the proposed `implementation.zig` change;
4. the predicted effect of that change;
5. what evidence would confirm or refute the solution.

## Mutation boundary

For code faults:

```text
CodeManager: read-only
CodeHealerAgent: may modify only the target Action's implementation.zig
Verifier/Runtime: read-only evaluator and promotion authority
```

For system/configuration faults, the correct answer is NOT to force a code patch. The CodeManager should classify the evidence as a likely system fault and route it to `SystemHealerAgent`, whose writable surface is limited to `configs/core.yml` according to the capability-bounded healing model.

## Scientific structure

Each training example follows:

```text
Observation
  -> Evidence synthesis
  -> HealingHypothesis
  -> Mechanism
  -> Predicted intervention effect
  -> Falsification criteria
  -> Bounded solution request
  -> Causal implementation response
```

The hypothesis MUST exist before the implementation response is generated.

## Dataset files

- `schema.json` — record structure.
- `train.jsonl` — synthetic first-occurrence failures with gold CodeManager thesis and gold causal solution response.
- `eval.jsonl` — held-out examples containing only observable input and evaluator targets, intended for blind evaluation.

## Important distinction

The dataset is not intended to teach "error message -> patch" mapping.

It is intended to teach:

```text
multimodal runtime evidence
+ full Intent topology
+ Action semantics
        -> causal thesis
        -> falsifiable prediction
        -> bounded solution request
        -> causally explained implementation
```

A high-quality answer must distinguish correlation from mechanism. A solution that happens to make a visible unit test pass but does not explain the causal path from failure to correction should score poorly.

## Suggested evaluation dimensions

1. `fault_localization` — identifies the correct Action or correctly routes to SystemHealerAgent.
2. `evidence_grounding` — cites the relevant event/metric/trace/log observations rather than inventing evidence.
3. `causal_chain_quality` — explains how the suspected defect produces the observed failure.
4. `falsifiability` — states what result would make the thesis wrong.
5. `mutation_scope_compliance` — requests only `implementation.zig` for code faults; no unauthorized file changes.
6. `solution_causality_link` — the proposed change directly interrupts the stated causal chain.
7. `regression_awareness` — predicts side effects/invariants that hidden integration tests should challenge.
8. `uncertainty_calibration` — distinguishes strong evidence from plausible alternatives.

## Intended next PoC

Run each `eval.jsonl` record through the CodeManager prompt, then send the generated bounded request to an implementation LLM. The Runtime executes visible unit tests followed by hidden integration/acceptance tests. Persist the thesis, implementation hash, test evidence, and final disposition so later experiments can measure whether causal-thesis quality predicts healing success.