// Deterministic reference implementation for ABP v0.1.
// All arithmetic is explicitly reduced to unsigned 32-bit semantics so the
// observable behavior matches the Zig/WebAssembly implementation.

export function kernel(seed, iterations) {
  let x = seed >>> 0;
  const count = iterations >>> 0;

  for (let i = 0; i < count; i += 1) {
    x = (Math.imul((x ^ i) >>> 0, 1664525) + 1013904223) >>> 0;
  }

  return x >>> 0;
}

export function identity(value) {
  return value >>> 0;
}
