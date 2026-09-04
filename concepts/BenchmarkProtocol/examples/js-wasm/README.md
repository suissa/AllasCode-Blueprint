# ABP v0.1 Reference Benchmark — JavaScript vs Zig/WebAssembly

This example is the first executable reference implementation of the AllasCode Benchmark Protocol.

It compares two physical implementations of the same deterministic Behavior:

```text
Benchmark.referenceKernel
  |- javascript/kernel.js
  `- wasm/kernel.zig -> kernel.wasm
```

## Requirements

- Zig 0.16.x
- a modern Chrome version
- any local static HTTP server
- Chrome DevTools MCP for automated evidence collection (optional for manual runs)

## Build

```bash
make wasm
```

The build uses Zig's browser-oriented freestanding WebAssembly target:

```bash
zig build-exe kernel.zig \
  -target wasm32-freestanding \
  -O ReleaseFast \
  -fno-entry \
  --export=kernel \
  --export=identity \
  --export=linear_memory_bytes
```

## Serve

```bash
make serve
```

Open `http://localhost:8080`.

The page shows `ABP_READY` when the harness can be invoked.

## Programmatic execution

```js
const evidence = await window.AllasBenchmark.run();
```

The result is a `BenchmarkEvidence` object.

A correctness mismatch produces invalid evidence and **no performance ranking**.

## Diagnostic profiling

Primary timing and profiling are intentionally different runs.

For a Chrome DevTools trace, start tracing first and then execute:

```js
await window.AllasBenchmark.profile("javascript")
```

or:

```js
await window.AllasBenchmark.profile("wasm-zig")
```

Stop tracing after the call returns.

## Memory diagnosis

For before/after heap snapshots:

```js
await window.AllasBenchmark.memoryWorkload("javascript")
```

or:

```js
await window.AllasBenchmark.memoryWorkload("wasm-zig")
```

The WASM implementation separately exposes its current linear-memory size through `linear_memory_bytes()`.

## What is measured

The reference harness currently records:

- behavioral equivalence;
- JS module cold import time;
- WASM fetch time;
- WASM compile time;
- WASM instantiate time;
- discarded warmup;
- interleaved repeated execution samples;
- median, p95, p99, mean and standard deviation;
- operations/second;
- JS function-call baseline;
- JS->WASM boundary-call measurement;
- WASM linear memory size;
- evidence and input/output digests where available.

## Why execution order alternates

For sample 0 the order is JS then WASM. For sample 1 it is WASM then JS, and so on.

This reduces systematic bias caused by always measuring one implementation first under a different thermal/JIT/scheduling state.

## Important limitation

`performance_start_trace` should not wrap the primary timing run. Chrome tracing adds instrumentation overhead. Run the trace separately to explain CPU/JIT/GC behavior.

Likewise, a JavaScript heap snapshot is not total WebAssembly memory. The two sources are represented independently in ABP.
