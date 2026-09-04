# AllasCode Benchmark Protocol v0.1

**Status:** Draft  
**Normative language:** MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are used as requirement terms.

## 1. Scope

The AllasCode Benchmark Protocol (ABP) defines a transport- and profiler-agnostic evidence model for comparing multiple physical implementations of one semantic Behavior.

ABP v0.1 defines three canonical artifacts:

```text
BenchmarkScenario
BenchmarkRun
BenchmarkEvidence
```

ABP does not define which implementation must be selected at runtime. Selection belongs to a separate binding policy or Fitness Function.

## 2. Semantic model

Let:

- `B` be a semantic Behavior;
- `I = {i1, i2, ..., in}` be implementation candidates for `B`;
- `E` be an execution environment;
- `X` be a benchmark input;
- `O(i, X)` be the observable output of implementation `i` for `X`;
- `M(i, E, X)` be measured execution evidence.

A candidate may participate in comparative performance evidence only if it belongs to the same behavioral-equivalence class for the tested input.

```text
Equivalent(ia, ib, X) iff Oracle(O(ia, X), O(ib, X)) = true
```

Then and only then may:

```text
Compare(M(ia, E, X), M(ib, E, X))
```

be considered valid evidence about alternative implementations of `B`.

## 3. Mandatory invariants

### INV-ABP-001 — Behavioral equivalence before ranking

If the correctness oracle fails between two candidates, comparative performance evidence between those candidates MUST be marked invalid.

### INV-ABP-002 — Evidence is not policy

A `BenchmarkEvidence` artifact MUST NOT encode a universal performance threshold such as “WASM is acceptable if it is 20% faster”. Thresholds belong to architecture-specific Fitness Functions or runtime binding policies.

### INV-ABP-003 — Measurement boundaries are explicit

Cold-load, compilation, instantiation, warm execution and boundary-transfer costs MUST NOT be merged into a single unnamed latency metric.

### INV-ABP-004 — Profiler time is diagnostic

Instrumentation that materially changes execution behavior, including sampling profilers and tracing, SHOULD NOT be the sole source of primary wall-clock benchmark samples. Profiling runs SHOULD be recorded separately from timing runs.

### INV-ABP-005 — WASM memory is not JS heap

JavaScript heap evidence MUST NOT be interpreted as total WebAssembly memory usage. WebAssembly linear memory MUST be reported independently when present.

### INV-ABP-006 — Environment is evidence

Every run MUST identify the execution environment sufficiently to distinguish materially different runs. At minimum this includes browser/runtime identity and benchmark-controlled CPU/network/cache settings when applicable.

### INV-ABP-007 — No cross-run silent mutation

A harness MUST NOT silently change benchmark input, implementation artifact or measurement configuration across candidates within the same comparison set.

### INV-ABP-008 — Warmup is not measurement

Warmup iterations MUST NOT be mixed with measured samples.

### INV-ABP-009 — Failed runs are retained as evidence

A failed or invalid run SHOULD be retained with its failure reason. It MUST NOT be silently discarded and rerun until a favorable result appears.

### INV-ABP-010 — Same work requirement

A candidate MUST NOT be considered equivalent merely because its final scalar return value matches if the scenario declares additional observable effects. The correctness oracle MUST cover all observables declared by the scenario.

## 4. BenchmarkScenario

A `BenchmarkScenario` declares what is being compared and how evidence will be collected.

Required conceptual fields:

```text
protocolVersion
scenarioId
behavior
implementations[]
input
correctness
measurement
metrics[]
environments[]
```

The scenario declares configuration, not conclusions.

### 4.1 Behavior

`behavior` identifies the semantic operation under test. It SHOULD use the canonical AllasCode Behavior label when one exists.

Example:

```text
Product.calculatePrice
```

### 4.2 ImplementationCandidate

Each candidate MUST have a stable identifier for the scenario and SHOULD identify its runtime and artifact.

Example:

```json
{
  "id": "javascript",
  "runtime": "javascript",
  "artifact": "./javascript/kernel.js"
}
```

### 4.3 Correctness oracle

v0.1 standardizes the following oracle mode:

```text
deterministic-equality
```

The harness executes every candidate over the same input and compares the declared observable result.

Future versions may add property-based, tolerance-based, trace-equivalence or domain-specific oracles.

### 4.4 Measurement phases

ABP v0.1 recognizes these phases:

```text
load
compile
instantiate
warmup
execution
boundary
memory
network
profiling
```

A scenario MAY omit phases that do not apply to a candidate, but it MUST NOT fabricate zero values for non-applicable phases. Use absence/null semantics instead.

## 5. BenchmarkRun

A `BenchmarkRun` is evidence for one candidate in one resolved environment.

The run has one of these states:

```text
valid
invalid
failed
```

### valid

Execution completed, correctness requirements were satisfied, and measurements are eligible for comparison.

### invalid

Execution completed but a protocol invariant or correctness condition failed.

### failed

The harness or implementation failed before a valid measurement could be produced.

### 5.1 Samples

Primary execution measurements SHOULD retain raw samples.

Derived statistics MAY include:

```text
count
min
max
mean
median
p95
p99
standardDeviation
operationsPerSecond
```

Raw samples remain the canonical basis for recomputation.

### 5.2 Digests

A run SHOULD record stable digests for:

- scenario;
- benchmark input;
- implementation artifact when available;
- observable output.

A digest identifies evidence lineage; it is not a semantic type.

## 6. BenchmarkEvidence

`BenchmarkEvidence` groups runs that belong to the same scenario and comparison set.

It MUST contain:

```text
protocolVersion
evidenceId
scenarioId
runs[]
equivalence
comparisons[]
```

### 6.1 Equivalence

The evidence artifact MUST explicitly state which candidate runs were behaviorally equivalent under the configured oracle.

### 6.2 Comparisons

Comparisons are derived observations such as ratios and deltas. They are not binding decisions.

Example:

```text
execution.median ratio
coldLoad delta
throughput ratio
linearMemory delta
```

The protocol MUST preserve the direction and units of every comparison.

### 6.3 Binding

A runtime MAY consume `BenchmarkEvidence` through a separate policy:

```text
BindingPolicy(Behavior, Environment, Evidence) -> ImplementationCandidate
```

ABP does not standardize `BindingPolicy` in v0.1.

## 7. JS/WASM measurement profile

The reference JS/WASM profile records at least:

```text
correctness result
module load/fetch time
WASM compile time
WASM instantiate time
warm execution samples
throughput
scalar boundary-call cost
batched execution cost
JS heap evidence when available
WASM linear memory byteLength
network transfer evidence when available
```

### 7.1 Primary timer

For browser-local timing, the reference profile uses the browser high-resolution performance clock through `performance.now()`.

The MCP call latency itself MUST NOT be included in implementation execution time.

### 7.2 Profiling

Chrome performance traces are collected as separate diagnostic runs. The trace explains CPU, JIT, GC and scheduling behavior but does not replace the primary timing samples.

## 8. Chrome DevTools MCP adapter

Chrome DevTools MCP is an instrumentation adapter for ABP.

Recommended mapping:

```text
new_page / navigate_page      -> isolation and cache state
evaluate_script               -> harness invocation and primary timing
emulate                       -> controlled CPU/network environment
performance_start_trace       -> diagnostic profiling
performance_stop_trace        -> diagnostic profiling
list_network_requests         -> transfer evidence
get_network_request           -> request detail evidence
take_heapsnapshot             -> JS heap evidence
get_heapsnapshot_summary      -> JS heap evidence
compare_heapsnapshots         -> JS heap delta evidence
list_console_messages         -> failure evidence
get_console_message           -> failure diagnosis
```

The adapter MUST preserve the distinction between primary measurement and diagnostic profiling.

## 9. Evidence lifecycle

```text
ScenarioDeclared
      |
      v
ArtifactsResolved
      |
      v
CorrectnessExecuted
      |
      +-- fail --> InvalidEvidence
      |
      v
WarmupExecuted
      |
      v
PrimaryMeasurementsCollected
      |
      v
OptionalDiagnosticsCollected
      |
      v
BenchmarkEvidenceSealed
      |
      v
FitnessFunction / BindingPolicy
```

## 10. Versioning

ABP uses semantic protocol versions.

`0.1` is intentionally small. Any future version that changes the meaning of existing evidence fields MUST increment the protocol version.

## 11. Non-goals of v0.1

ABP v0.1 does not standardize:

- universal pass/fail performance thresholds;
- automatic production binding;
- distributed benchmark scheduling;
- cryptographic attestation of benchmark hosts;
- native-process RSS measurement;
- energy consumption;
- GPU benchmarking;
- cross-browser normalization.

These can be layered over the evidence model without changing the semantic Behavior itself.
