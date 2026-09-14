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
- `runner.py` — executable evaluator and provider interface.
- `tests/test_runner.py` — stdlib unit tests for gold isolation, scoring, and mutation-boundary rules.

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

## Evaluation dimensions

The executable evaluator reports:

1. `fault_class` — code, system, or unknown classification.
2. `fault_localization` — target Action/config scope.
3. `evidence_grounding` — uses observations available in the failed Intent rather than invented facts.
4. `causal_chain_quality` — connects cause, mechanism, and observed failure.
5. `falsifiability` — states observable refutation criteria.
6. `solution_request_quality` — asks the correct Healer for a bounded intervention.
7. `mutation_scope_compliance` — preserves the RO/RW capability boundary.
8. `uncertainty_calibration` — preserves `unknown` when evidence is underdetermined.

The aggregate `overall` score is a weighted summary; dimension scores should be inspected independently because a safe `unknown` decision can be more important than lexical similarity to a reference answer.

## Running the PoC

The runner uses only the Python standard library.

Scorer smoke test using the stored gold theses:

```bash
python3 Blueprint/datasets/codemanager-causal-healing/runner.py \
  --provider gold \
  --output /tmp/codemanager-gold-report.json
```

`gold` is only a scorer/control-path check. It MUST NOT be reported as model performance.

To evaluate a real CodeManager/LLM, expose it as a command that reads one JSON object from stdin and prints one JSON object to stdout:

```bash
python3 Blueprint/datasets/codemanager-causal-healing/runner.py \
  --provider command \
  --command 'python3 path/to/my_codemanager_adapter.py' \
  --output /tmp/codemanager-report.json
```

The command receives only `observable_input` plus the output contract and safety rules. The runner never sends `gold_codemanager` or `gold_solution` to the external provider.

A CI gate can be added with:

```bash
python3 Blueprint/datasets/codemanager-causal-healing/runner.py \
  --provider command \
  --command '...' \
  --min-score 0.70
```

Exit code `2` means the aggregate score fell below the requested threshold.

## Provider protocol

Input to the external CodeManager process:

```json
{
  "task": "codemanager_causal_thesis",
  "record_id": "cm-eval-...",
  "observable_input": {},
  "contract": {},
  "rules": []
}
```

The output must contain at least:

```json
{
  "fault_class": "code",
  "suspected_scope": "Commerce.SomeAction/implementation.zig",
  "thesis": "...",
  "mechanism": "...",
  "causal_chain": ["..."],
  "evidence_for": ["..."],
  "evidence_against_or_missing": ["..."],
  "alternative_causes": ["..."],
  "falsification_criteria": ["..."],
  "predicted_intervention_effect": "...",
  "solution_request": "..."
}
```

The thesis is produced before any CodeHealer/SystemHealer invocation. A later healing runner can consume `solution_request`, apply the authorized mutation, run visible + hidden tests, and compare observed effects to `predicted_intervention_effect`.

## Tests

Run:

```bash
python3 -m unittest discover \
  -s Blueprint/datasets/codemanager-causal-healing/tests \
  -p 'test_*.py'
```

The tests verify that gold data is absent from the public provider input and that the CodeManager cannot score mutation-scope compliance by asking the wrong healer to modify the wrong artifact.

## Next experimental stage

The next stage is a closed causal-healing experiment:

```text
failed Intent evidence
  -> CodeManager thesis
  -> immutable HealingHypothesis
  -> CodeHealerAgent OR SystemHealerAgent
  -> bounded mutation
  -> visible unit tests
  -> hidden integration/acceptance flow
  -> predicted vs observed effects
  -> supported | falsified | inconclusive
```

Persist the thesis hash, candidate artifact hash, test evidence, and final disposition so the Knowledge layer can learn which causal hypotheses and intervention families generalize across future failures.