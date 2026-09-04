// Deterministic reference implementation for ABP v0.1.
// Explicit wrapping operators preserve the same unsigned 32-bit semantics as
// the JavaScript implementation.

export fn kernel(seed: u32, iterations: u32) u32 {
    var x = seed;
    var i: u32 = 0;

    while (i < iterations) : (i += 1) {
        x = ((x ^ i) *% 1664525) +% 1013904223;
    }

    return x;
}

export fn identity(value: u32) u32 {
    return value;
}
