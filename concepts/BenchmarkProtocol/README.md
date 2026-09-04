# AllasCode Benchmark Protocol

**Status:** Draft v0.1  
**Purpose:** produce reproducible implementation evidence without coupling semantic Behaviors to a physical runtime.

The AllasCode Benchmark Protocol (ABP) defines how equivalent implementations of the same semantic Behavior are validated, measured and compared.

The protocol does **not** declare that an Action is JavaScript, WebAssembly, Zig, native code or any other implementation technology. A semantic Behavior can expose multiple `ImplementationCandidate`s. Benchmark evidence is one input that a runtime binder may use when selecting a candidate for a concrete execution environment.

```text
Semantic Behavior
      |
      v
Implementation Candidates
   JS       WASM       ...
    \        /
     \      /
      v    v
 BenchmarkScenario
      |
      v
 BenchmarkRun(s)
      |
      v
BenchmarkEvidence
      |
      v
Runtime Binding Policy
```

## Core invariant

Performance evidence is valid only after behavioral equivalence has been established for the scenario input.

```text
Equivalent(JS, WASM, input) = true
```

If the correctness oracle fails, the run is `invalid` and MUST NOT participate in performance ranking.

A faster implementation that computes a different result is not a faster implementation of the same Behavior.

## Separation of concerns

ABP separates three concerns:

1. **Protocol** — defines scenario, run and evidence semantics.
2. **Harness** — executes implementations and produces protocol-compliant measurements.
3. **Instrumentation Adapter** — observes a concrete environment. Chrome DevTools MCP is one adapter, not the protocol itself.

This allows the same protocol to later be implemented by browser DevTools, native profilers, CI workers, edge devices or AllasCode runtime probes.

## Files

- [`SPEC-v0.1.md`](./SPEC-v0.1.md) — normative protocol specification.
- [`schemas/benchmark-scenario.schema.json`](./schemas/benchmark-scenario.schema.json) — `BenchmarkScenario` schema.
- [`schemas/benchmark-run.schema.json`](./schemas/benchmark-run.schema.json) — `BenchmarkRun` schema.
- [`schemas/benchmark-evidence.schema.json`](./schemas/benchmark-evidence.schema.json) — `BenchmarkEvidence` schema.
- [`adapters/chrome-devtools-mcp.md`](./adapters/chrome-devtools-mcp.md) — Chrome DevTools MCP mapping.
- [`examples/js-wasm/`](./examples/js-wasm/) — executable JavaScript vs Zig/WebAssembly reference benchmark.

## v0.1 measurement model

The protocol distinguishes:

- correctness;
- cold load;
- compile/parse cost;
- WASM instantiation;
- warm execution;
- throughput;
- JS/WASM boundary cost;
- variance;
- network transfer;
- JavaScript heap evidence;
- WebAssembly linear-memory evidence.

The protocol intentionally defines **no universal performance threshold**. A result becomes evidence; policies and Fitness Functions decide what that evidence means for a particular architecture and environment.

## Reference example

The reference benchmark uses the same deterministic 32-bit integer kernel in JavaScript and Zig compiled to `wasm32-freestanding`.

Build the WASM artifact with Zig 0.16:

```bash
cd concepts/BenchmarkProtocol/examples/js-wasm
make wasm
```

Serve the directory over HTTP:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The browser exposes the runner as:

```js
await window.AllasBenchmark.run()
```

The same function can be invoked by Chrome DevTools MCP through `evaluate_script`.

## Design rule

`BenchmarkEvidence` is immutable evidence about observed execution. It is not a hard-coded runtime decision.

```text
Evidence != Policy
Evidence != Binding
Evidence != Fitness threshold
```

This distinction lets AllasCode evolve binding decisions independently from the instrumentation used to collect measurements.
