# TypeScript Backend

Projection target for generated TypeScript bindings, test harnesses, SDK-facing artifacts, and executable semantic examples.

This backend is **not** the canonical AllasCode Runtime implementation. The canonical Runtime is implemented in **Zig 0.16**.

A TypeScript backend may reproduce Runtime contracts for conformance tests or generate language-specific bindings, but it must not become the authority for Runtime semantics. Canonical execution rules, supervision, healing, proof, orchestration, acceptance, persistence, and event semantics remain language-independent at the semantic layer and are implemented by the Zig Runtime.
