# Prompt Contracts for the CodeManager Causal Healing PoC

## 1. CodeManager prompt contract

The CodeManager receives one failed Intent execution. Assume this exact failure has never occurred before.

Available evidence:

- complete Intent goal and invariants;
- ordered Action descriptions and contracts;
- events emitted during the execution;
- runtime metrics;
- distributed traces/spans;
- logs;
- terminal error message.

The CodeManager is read-only. It MUST NOT propose direct source edits. It must infer a falsifiable causal thesis before any implementation model is asked to change code.

Required output:

```text
fault_class: code | system | unknown
suspected_scope: <Action/implementation.zig | configs/core.yml | undetermined>
thesis: <single falsifiable causal claim>
mechanism: <why the suspected cause produces the observed evidence>
causal_chain:
  - <cause -> intermediate effect>
  - <intermediate effect -> observed failure>
evidence_for:
  - <specific event/metric/trace/log>
evidence_against_or_missing:
  - <evidence that weakens the thesis or is still absent>
alternative_causes:
  - <plausible alternative>
falsification_criteria:
  - <observable result that would refute the thesis>
predicted_intervention_effect: <what should change if the thesis is correct>
solution_request: <bounded request to the appropriate Healer>
```

Rules:

1. Do not infer facts not present in the evidence.
2. Do not equate temporal correlation with causality without a mechanism.
3. Prefer the smallest causal explanation that accounts for the complete Intent evidence.
4. Use evidence from the full Intent, not only from the terminal Action.
5. If code and system causes cannot be distinguished, return `unknown` and request more evidence instead of requesting mutation.
6. For `code`, the solution request may authorize only the suspected Action's `implementation.zig`.
7. For `system`, route to SystemHealerAgent and authorize only healable values in `configs/core.yml`.
8. The thesis must be written before a solution is generated.

## 2. CodeHealer/implementation LLM prompt contract

The implementation model receives:

- the CodeManager's immutable HealingHypothesis;
- the target Action's contract, invariants, types, skill, visible unit tests and current `implementation.zig`;
- write capability only for the target `implementation.zig`.

It MUST NOT reinterpret the failure into a different cause merely to justify its preferred patch. If the hypothesis is inconsistent with the implementation evidence it can observe, it should state that conflict rather than silently changing the thesis.

Required response before writing the candidate implementation:

```text
accepted_thesis: <restatement of the causal thesis>
causal_explanation: <how the current implementation can produce the observed failure>
solution_mechanism: <how the proposed implementation interrupts that causal chain>
mutation_scope: <exact implementation.zig>
predicted_effects:
  - <observable expected change>
preserved_invariants:
  - <invariant expected to remain true>
risks:
  - <possible regression/failure mode>
verification_predictions:
  - <what visible/hidden tests should observe if the solution is correct>
refutation_condition:
  - <what result would show that this implementation did not test the thesis successfully>
```

Then the model may produce the candidate `implementation.zig`.

## 3. SystemHealerAgent prompt contract

For a system thesis, the SystemHealerAgent receives the immutable thesis and read access to runtime evidence, but write capability only to healable values in `configs/core.yml`.

It must explain:

- which configuration value participates in the causal chain;
- why changing that value should alter the observed failure;
- the permitted safety bounds;
- which metrics must improve;
- which invariants/SLOs must remain unchanged.

It MUST NOT modify Action implementations.

## 4. Verifier contract

The verifier does not judge whether the explanation sounds plausible. It evaluates whether the intervention produces the predictions declared before mutation.

For each candidate, persist:

```text
HealingHypothesis hash
AgentID
ExecutionID
target Action/config
candidate artifact hash
visible unit-test evidence
hidden integration evidence
hidden acceptance/conformance evidence
predicted effects
observed effects
hypothesis disposition: supported | falsified | inconclusive
candidate disposition: promote | reject | quarantine
```

A candidate passing visible tests is insufficient. Promotion requires the complete hidden flow evidence defined by the Runtime.

## 5. Why causal linkage is mandatory

The desired learning target is not:

```text
error text -> patch
```

It is:

```text
observations
  -> causal thesis
  -> predicted intervention
  -> bounded mutation
  -> observed consequences
  -> support/falsification
```

This makes every autonomous mutation an experiment against an explicit prior hypothesis and gives the AllasCode knowledge layer reusable causal evidence rather than only a history of patches.