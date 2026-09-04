# Chrome DevTools MCP Adapter for ABP v0.1

This document maps Chrome DevTools MCP capabilities to the AllasCode Benchmark Protocol (ABP).

Chrome DevTools MCP is an instrumentation adapter. It does not define benchmark semantics, pass/fail thresholds, or runtime binding policy.

## Recommended server configuration

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--headless=true",
        "--isolated=true",
        "--memoryDebugging=true",
        "--performanceCrux=false",
        "--usageStatistics=false"
      ]
    }
  }
}
```

`--performanceCrux=false` is recommended for ABP microbenchmarks because CrUX field data is unrelated to the controlled local execution being measured.

## Selected tools

| ABP responsibility | Chrome DevTools MCP tool |
|---|---|
| create clean page | `new_page` |
| controlled navigation/cache | `navigate_page` |
| synchronize harness | `wait_for` |
| primary execution | `evaluate_script` |
| CPU/network control | `emulate` |
| diagnostic CPU/JIT/GC trace | `performance_start_trace` |
| finish trace | `performance_stop_trace` |
| enumerate transfer evidence | `list_network_requests` |
| inspect a resource | `get_network_request` |
| JS heap capture | `take_heapsnapshot` |
| JS heap aggregate | `get_heapsnapshot_summary` |
| before/after heap delta | `compare_heapsnapshots` |
| collect failure evidence | `list_console_messages` |
| diagnose console failure | `get_console_message` |

## Execution sequence

### Primary timing run

```text
new_page
   |
   v
emulate(environment)
   |
   v
navigate_page(benchmark URL)
   |
   v
wait_for("ABP_READY")
   |
   v
evaluate_script(() => window.AllasBenchmark.run())
   |
   v
BenchmarkRun
```

The elapsed MCP request time MUST NOT be interpreted as benchmark execution time. The harness measures inside the browser using the browser performance clock.

### Diagnostic profiling run

Run profiling separately from the primary timing run:

```text
performance_start_trace(reload=false, autoStop=false)
   |
   v
evaluate_script(() => window.AllasBenchmark.profile())
   |
   v
performance_stop_trace(filePath=...)
```

ABP treats the trace as diagnostic evidence because tracing enables sampling/instrumentation that may perturb execution.

### Memory run

```text
take_heapsnapshot(before)
   |
   v
evaluate_script(() => window.AllasBenchmark.memoryWorkload())
   |
   v
take_heapsnapshot(after)
   |
   v
compare_heapsnapshots(before, after)
```

In parallel with the heap snapshot result, the harness MUST report WebAssembly linear memory separately:

```js
instance.exports.memory?.buffer.byteLength
```

A JS heap snapshot MUST NOT be reported as total WASM memory.

## Cold vs warm execution

### Cold

Use a new isolated page/context and a cache-busting artifact URL or explicit cache control. Record load/compile/instantiate separately.

### Warm

Load each candidate once, execute warmup iterations, discard them, then collect measured samples.

## CPU profiles

Use `emulate` with explicit `cpuThrottlingRate` values declared by the `BenchmarkScenario`. The adapter MUST record the configured rate into every `BenchmarkRun.environment`.

The adapter does not decide which rates are meaningful for a product. That is scenario configuration.

## Network profiles

Use `emulate.networkConditions` only when the scenario explicitly includes network-sensitive measurements. Network throttling MUST NOT be accidentally enabled for pure warm-execution comparisons.

## Cache policy

Every comparison set MUST identify cache behavior. A candidate may not be compared under cold cache against another candidate under warm cache unless the scenario explicitly studies that difference.

## Failure handling

If the harness throws, returns malformed evidence, fails correctness, or emits a benchmark assertion error:

1. retain the failed `BenchmarkRun`;
2. set `status` to `failed` or `invalid` as appropriate;
3. collect console evidence;
4. do not rank the failed run;
5. do not silently repeat until a favorable sample appears.

## Tool surface for a Benchmark Agent

The recommended initial capability set is intentionally small:

```text
new_page
navigate_page
wait_for
evaluate_script
emulate
performance_start_trace
performance_stop_trace
list_network_requests
get_network_request
take_heapsnapshot
get_heapsnapshot_summary
compare_heapsnapshots
list_console_messages
get_console_message
```

Advanced heap tools should be granted only when the benchmark Intent requires memory diagnosis.

## Adapter output

The adapter MUST emit protocol artifacts, not Chrome-specific decisions:

```text
Chrome DevTools observations
          |
          v
      BenchmarkRun
          |
          v
   BenchmarkEvidence
```

A separate AllasCode Fitness Function or Binding Policy consumes that evidence later.
