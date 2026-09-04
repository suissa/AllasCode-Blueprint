import { readFile } from "node:fs/promises";
import { kernel as jsKernel, identity as jsIdentity } from "./javascript/kernel.js";

const wasmBytes = await readFile(new URL("./wasm/kernel.wasm", import.meta.url));
const { instance } = await WebAssembly.instantiate(wasmBytes, {});

const wasmKernel = instance.exports.kernel;
const wasmIdentity = instance.exports.identity;
const linearMemoryBytes = instance.exports.linear_memory_bytes;

if (typeof wasmKernel !== "function") throw new Error("Missing WASM export: kernel");
if (typeof wasmIdentity !== "function") throw new Error("Missing WASM export: identity");
if (typeof linearMemoryBytes !== "function") {
  throw new Error("Missing WASM export: linear_memory_bytes");
}

const vectors = [
  { seed: 0, iterations: 0 },
  { seed: 1, iterations: 1 },
  { seed: 0xffffffff, iterations: 17 },
  { seed: 0x12345678, iterations: 1000 },
  { seed: 0x12345678, iterations: 250000 },
];

for (const vector of vectors) {
  const js = jsKernel(vector.seed, vector.iterations) >>> 0;
  const wasm = Number(wasmKernel(vector.seed, vector.iterations)) >>> 0;

  if (js !== wasm) {
    throw new Error(
      `Behavioral equivalence failed for ${JSON.stringify(vector)}: JS=${js}, WASM=${wasm}`,
    );
  }
}

for (const value of [0, 1, 42, 0xffffffff]) {
  const js = jsIdentity(value) >>> 0;
  const wasm = Number(wasmIdentity(value)) >>> 0;
  if (js !== wasm) {
    throw new Error(`identity() mismatch for ${value}: JS=${js}, WASM=${wasm}`);
  }
}

const memoryBytes = Number(linearMemoryBytes()) >>> 0;

console.log(
  JSON.stringify(
    {
      protocolVersion: "0.1",
      verification: "behavioral-equivalence",
      status: "valid",
      vectors: vectors.length,
      wasmLinearMemoryBytes: memoryBytes,
    },
    null,
    2,
  ),
);
