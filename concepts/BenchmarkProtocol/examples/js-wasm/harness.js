const state = {
  scenario: null,
  implementations: null,
  lastEvidence: null,
};

function now() {
  return performance.now();
}

function hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value) {
  const bytes =
    value instanceof Uint8Array
      ? value
      : new TextEncoder().encode(
          typeof value === "string" ? value : JSON.stringify(value),
        );
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

function quantile(sorted, p) {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];

  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function statistics(samples, operationsPerSample) {
  if (samples.length === 0) {
    return {
      count: 0,
      minMs: null,
      maxMs: null,
      meanMs: null,
      medianMs: null,
      p95Ms: null,
      p99Ms: null,
      standardDeviationMs: null,
      operationsPerSecond: null,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const variance =
    samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    samples.length;
  const median = quantile(sorted, 0.5);

  return {
    count: samples.length,
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    meanMs: mean,
    medianMs: median,
    p95Ms: quantile(sorted, 0.95),
    p99Ms: quantile(sorted, 0.99),
    standardDeviationMs: Math.sqrt(variance),
    operationsPerSecond:
      median > 0 ? operationsPerSample / (median / 1000) : null,
  };
}

async function loadScenario() {
  if (state.scenario) return state.scenario;

  const response = await fetch("./scenario.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load scenario.json: HTTP ${response.status}`);
  }

  state.scenario = await response.json();
  return state.scenario;
}

async function loadJavaScript(candidate) {
  const url = new URL(candidate.artifact, document.baseURI);
  url.searchParams.set("abp_run", crypto.randomUUID());

  const started = now();
  const module = await import(url.href);
  const loadMs = now() - started;

  if (typeof module.kernel !== "function" || typeof module.identity !== "function") {
    throw new Error("JavaScript candidate does not export kernel() and identity()");
  }

  return {
    id: candidate.id,
    runtime: candidate.runtime,
    artifact: candidate.artifact,
    artifactDigest: null,
    loadMs,
    compileMs: null,
    instantiateMs: null,
    kernel: module.kernel,
    identity: module.identity,
    linearMemoryBytes: null,
  };
}

async function loadWasm(candidate) {
  const url = new URL(candidate.artifact, document.baseURI);
  url.searchParams.set("abp_run", crypto.randomUUID());

  const loadStarted = now();
  const response = await fetch(url.href, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load WASM candidate: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const loadMs = now() - loadStarted;

  const compileStarted = now();
  const module = await WebAssembly.compile(bytes);
  const compileMs = now() - compileStarted;

  const instantiateStarted = now();
  const instance = await WebAssembly.instantiate(module, {});
  const instantiateMs = now() - instantiateStarted;

  const { kernel, identity, linear_memory_bytes: linearMemoryBytesFn } =
    instance.exports;

  if (typeof kernel !== "function" || typeof identity !== "function") {
    throw new Error("WASM candidate does not export kernel() and identity()");
  }

  let linearMemoryBytes = null;
  if (typeof linearMemoryBytesFn === "function") {
    linearMemoryBytes = Number(linearMemoryBytesFn()) >>> 0;
  } else if (instance.exports.memory instanceof WebAssembly.Memory) {
    linearMemoryBytes = instance.exports.memory.buffer.byteLength;
  }

  return {
    id: candidate.id,
    runtime: candidate.runtime,
    artifact: candidate.artifact,
    artifactDigest: await sha256(bytes),
    loadMs,
    compileMs,
    instantiateMs,
    kernel,
    identity,
    linearMemoryBytes,
    instance,
  };
}

async function loadImplementations(scenario) {
  const loaded = [];

  for (const candidate of scenario.implementations) {
    if (candidate.runtime === "javascript") {
      loaded.push(await loadJavaScript(candidate));
    } else if (candidate.runtime === "webassembly") {
      loaded.push(await loadWasm(candidate));
    } else {
      throw new Error(`Unsupported reference runtime: ${candidate.runtime}`);
    }
  }

  return loaded;
}

function runObservable(implementation, input) {
  return Number(implementation.kernel(input.seed >>> 0, input.iterations >>> 0)) >>> 0;
}

function warmup(implementation, scenario) {
  const { seed, iterations } = scenario.input;
  const count = scenario.measurement.warmupIterations;
  let sink = 0;

  for (let i = 0; i < count; i += 1) {
    sink ^= Number(
      implementation.kernel((seed + i) >>> 0, iterations >>> 0),
    ) >>> 0;
  }

  globalThis.__abpSink = sink >>> 0;
}

function measureSample(implementation, scenario) {
  const { seed, iterations } = scenario.input;
  const operations = scenario.measurement.operationsPerSample;
  let sink = 0;

  const started = now();
  for (let i = 0; i < operations; i += 1) {
    sink ^= Number(
      implementation.kernel((seed + i) >>> 0, iterations >>> 0),
    ) >>> 0;
  }
  const elapsed = now() - started;

  globalThis.__abpSink = sink >>> 0;
  return elapsed;
}

function measureBoundary(implementation, iterations) {
  if (!iterations) return null;

  let sink = 0;
  const started = now();
  for (let i = 0; i < iterations; i += 1) {
    sink ^= Number(implementation.identity(i >>> 0)) >>> 0;
  }
  const totalMs = now() - started;

  globalThis.__abpBoundarySink = sink >>> 0;

  return {
    iterations,
    totalMs,
    nanosecondsPerCall: (totalMs * 1_000_000) / iterations,
  };
}

function browserEnvironment(environment) {
  return {
    id: environment.id,
    runtime: "browser",
    runtimeVersion: null,
    platform: navigator.platform || null,
    userAgent: navigator.userAgent || null,
    cpuThrottlingRate: environment.cpuThrottlingRate ?? null,
    networkConditions: environment.networkConditions ?? null,
    cacheMode: environment.cacheMode ?? null,
  };
}

async function makeRun({
  scenario,
  implementation,
  environment,
  observable,
  correctnessPassed,
  samples,
  boundary,
  scenarioDigest,
  inputDigest,
  outputDigest,
  failureReason = null,
}) {
  const valid = correctnessPassed && !failureReason;

  return {
    protocolVersion: "0.1",
    runId: crypto.randomUUID(),
    scenarioId: scenario.scenarioId,
    implementationId: implementation.id,
    startedAt: null,
    completedAt: new Date().toISOString(),
    environment: browserEnvironment(environment),
    status: failureReason ? "failed" : valid ? "valid" : "invalid",
    failureReason,
    correctness: {
      oracle: scenario.correctness.oracle,
      passed: correctnessPassed,
      observable,
      outputDigest,
    },
    measurements: {
      loadMs: implementation.loadMs,
      compileMs: implementation.compileMs,
      instantiateMs: implementation.instantiateMs,
      executionSamplesMs: samples,
      statistics: statistics(samples, scenario.measurement.operationsPerSample),
      boundary,
      memory: {
        jsHeapBytes: null,
        wasmLinearMemoryBytes: implementation.linearMemoryBytes,
        heapSnapshotRef: null,
      },
      network: null,
    },
    digests: {
      scenario: scenarioDigest,
      input: inputDigest,
      artifact: implementation.artifactDigest,
      output: outputDigest,
    },
  };
}

function comparison(left, right, metric, operation, value, unit) {
  return { left, right, metric, operation, value, unit };
}

function buildComparisons(runs) {
  if (runs.length < 2 || runs.some((run) => run.status !== "valid")) return [];

  const [left, right] = runs;
  const comparisons = [];
  const leftMedian = left.measurements.statistics.medianMs;
  const rightMedian = right.measurements.statistics.medianMs;

  if (leftMedian != null && rightMedian != null && rightMedian !== 0) {
    comparisons.push(
      comparison(
        left.implementationId,
        right.implementationId,
        "execution.median",
        "ratio",
        leftMedian / rightMedian,
        "ratio",
      ),
    );
  }

  const leftBoundary = left.measurements.boundary?.nanosecondsPerCall;
  const rightBoundary = right.measurements.boundary?.nanosecondsPerCall;
  if (leftBoundary != null && rightBoundary != null) {
    comparisons.push(
      comparison(
        left.implementationId,
        right.implementationId,
        "boundary.nanosecondsPerCall",
        "delta",
        leftBoundary - rightBoundary,
        "ns/call",
      ),
    );
  }

  return comparisons;
}

async function run() {
  const scenario = await loadScenario();
  const environment = scenario.environments[0];
  const scenarioDigest = await sha256(scenario);
  const inputDigest = await sha256(scenario.input);

  // Fresh candidates for every evidence set keep cold-load data meaningful.
  const implementations = await loadImplementations(scenario);
  state.implementations = implementations;

  const observables = implementations.map((implementation) => ({
    implementationId: implementation.id,
    value: runObservable(implementation, scenario.input),
  }));

  const canonicalObservable = observables[0]?.value;
  const equivalent = observables.every(
    ({ value }) => value === canonicalObservable,
  );
  const outputDigest = await sha256(canonicalObservable);

  if (!equivalent) {
    const runs = [];
    for (let i = 0; i < implementations.length; i += 1) {
      runs.push(
        await makeRun({
          scenario,
          implementation: implementations[i],
          environment,
          observable: observables[i].value,
          correctnessPassed: false,
          samples: [],
          boundary: null,
          scenarioDigest,
          inputDigest,
          outputDigest: await sha256(observables[i].value),
        }),
      );
    }

    const evidence = {
      protocolVersion: "0.1",
      evidenceId: crypto.randomUUID(),
      scenarioId: scenario.scenarioId,
      createdAt: new Date().toISOString(),
      runs,
      equivalence: {
        oracle: scenario.correctness.oracle,
        groups: [],
        invalidComparisons: [
          {
            left: implementations[0].id,
            right: implementations[1].id,
            reason: "Correctness oracle failed: observable outputs differ",
          },
        ],
      },
      comparisons: [],
      diagnostics: [],
      evidenceDigest: null,
    };
    evidence.evidenceDigest = await sha256({ ...evidence, evidenceDigest: null });
    state.lastEvidence = evidence;
    return evidence;
  }

  // Warmup is deliberately separated and discarded.
  for (const implementation of implementations) {
    warmup(implementation, scenario);
  }

  const sampleMap = new Map(
    implementations.map((implementation) => [implementation.id, []]),
  );

  // Alternate execution order to reduce systematic first/second-run bias.
  for (let sampleIndex = 0; sampleIndex < scenario.measurement.samples; sampleIndex += 1) {
    const ordered =
      sampleIndex % 2 === 0
        ? implementations
        : [...implementations].reverse();

    for (const implementation of ordered) {
      sampleMap
        .get(implementation.id)
        .push(measureSample(implementation, scenario));
    }
  }

  const runs = [];
  for (let i = 0; i < implementations.length; i += 1) {
    const implementation = implementations[i];
    runs.push(
      await makeRun({
        scenario,
        implementation,
        environment,
        observable: observables[i].value,
        correctnessPassed: true,
        samples: sampleMap.get(implementation.id),
        boundary: measureBoundary(
          implementation,
          scenario.measurement.boundaryIterations,
        ),
        scenarioDigest,
        inputDigest,
        outputDigest,
      }),
    );
  }

  const evidence = {
    protocolVersion: "0.1",
    evidenceId: crypto.randomUUID(),
    scenarioId: scenario.scenarioId,
    createdAt: new Date().toISOString(),
    runs,
    equivalence: {
      oracle: scenario.correctness.oracle,
      groups: [implementations.map((implementation) => implementation.id)],
      invalidComparisons: [],
    },
    comparisons: buildComparisons(runs),
    diagnostics: [],
    evidenceDigest: null,
  };

  evidence.evidenceDigest = await sha256({ ...evidence, evidenceDigest: null });
  state.lastEvidence = evidence;
  return evidence;
}

async function ensureLoaded() {
  const scenario = await loadScenario();
  if (!state.implementations) {
    state.implementations = await loadImplementations(scenario);
  }
  return { scenario, implementations: state.implementations };
}

async function profile(implementationId = "javascript") {
  const { scenario, implementations } = await ensureLoaded();
  const implementation = implementations.find(
    (candidate) => candidate.id === implementationId,
  );
  if (!implementation) throw new Error(`Unknown implementation: ${implementationId}`);

  warmup(implementation, scenario);
  const samples = [];
  for (let i = 0; i < scenario.measurement.samples; i += 1) {
    samples.push(measureSample(implementation, scenario));
  }

  return {
    implementationId,
    samples,
    statistics: statistics(samples, scenario.measurement.operationsPerSample),
  };
}

async function memoryWorkload(implementationId = "javascript") {
  const { scenario, implementations } = await ensureLoaded();
  const implementation = implementations.find(
    (candidate) => candidate.id === implementationId,
  );
  if (!implementation) throw new Error(`Unknown implementation: ${implementationId}`);

  let sink = 0;
  const repetitions = Math.max(100, scenario.measurement.warmupIterations * 10);
  for (let i = 0; i < repetitions; i += 1) {
    sink ^= runObservable(implementation, {
      seed: (scenario.input.seed + i) >>> 0,
      iterations: scenario.input.iterations,
    });
  }
  globalThis.__abpMemorySink = sink >>> 0;

  return {
    implementationId,
    repetitions,
    wasmLinearMemoryBytes: implementation.linearMemoryBytes,
  };
}

export const AllasBenchmark = {
  run,
  profile,
  memoryWorkload,
  get scenario() {
    return state.scenario;
  },
  get lastEvidence() {
    return state.lastEvidence;
  },
};

globalThis.AllasBenchmark = AllasBenchmark;
globalThis.dispatchEvent(new CustomEvent("abp-ready"));
console.info("ABP_READY");
