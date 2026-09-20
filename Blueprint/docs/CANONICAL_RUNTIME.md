# Canonical AllasCode Runtime

## Status

Normative architecture rule.

## Canonical implementation language

The canonical AllasCode Runtime is implemented in **Zig 0.16**.

TypeScript, Go, Rust, Python, Haskell, Prolog, or any other language may be used for generated bindings, SDKs, Actions, tools, test harnesses, examples, adapters, compiler backends, or WASM-compatible extensions. None of those projections replace the canonical Runtime unless this normative decision is explicitly changed.

## Runtime pipeline

The canonical Runtime pipeline is:

```text
Intake
  → Resolver
  → Binding
  → Healing
  → Proof
  → Governor
  → Orchestration
  → Acceptance
  → Persistence
```

Runtime owns execution authority. Semantic artifacts describe what must happen; the Runtime decides how those semantics are materialized while preserving invariants, capability boundaries, supervision, healing, proof obligations, acceptance, and persistence rules.

## Language boundary

```text
Semantic model
    ↓
Intent / Behavior / Actor / Action / Event / 2flow
    ↓
canonical compiled/runtime contracts
    ↓
Zig 0.16 Runtime
    ↓
polyglot implementations / WASM / adapters / projections
```

The architecture is semantic-first and polyglot above the Runtime boundary. The existence of a TypeScript example or executable projection therefore means only that the semantic contract can be exercised from TypeScript.

## Reference harness rule

A directory containing TypeScript files named `runtime/` inside an example is a **reference execution harness**, not the canonical Runtime.

Reference harnesses may:

- simulate Runtime behavior;
- validate Semantic Graph projections;
- execute test fixtures;
- produce acceptance evidence;
- host mocks and sandbox adapters;
- test Action implementations and generated bindings.

Reference harnesses must not:

- redefine canonical Runtime semantics;
- become the source of truth for topology or event rules;
- imply Node.js or TypeScript is the production Runtime;
- weaken supervision, healing, proof, governor, acceptance, persistence, or capability rules;
- make language-specific types normative semantic types.

## Naming rule

Documentation should use the following terms consistently:

- **AllasCode Runtime** or **canonical Runtime** → Zig 0.16 implementation.
- **TypeScript reference harness** → executable validation/example projection.
- **TypeScript backend** → compiler/projection target, not Runtime implementation.
- **Action implementation** → language-specific implementation below a semantic Action contract.

This distinction is normative for Blueprint documentation and examples.
