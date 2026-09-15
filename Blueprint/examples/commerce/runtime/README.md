# TypeScript Reference Execution Harness

This directory is **not** the canonical AllasCode Runtime.

The canonical AllasCode Runtime is implemented in **Zig 0.16**. The TypeScript code here is a replaceable execution harness used by the commerce example to validate compiled Semantic Graph behavior, Action bindings, flow semantics, healing scenarios, tests, and acceptance evidence.

## Architectural rule

The harness must remain semantically subordinate to the canonical Runtime contract. It may model Runtime behavior for tests, but it must not redefine Runtime authority, topology, event semantics, healing semantics, persistence semantics, supervision, or proof obligations.

The example consumes compiled semantic topology rather than making TypeScript itself the architectural source of truth.

```text
semantic definitions
      ↓ compile
Semantic Graph
      ↓
TypeScript reference harness
      ↓
AgentRuntime → ActorSystem → ActionRegistry
      └───────────────→ ToolRegistry
      ↓
semantic / acceptance evidence
```

Production execution is conceptually:

```text
semantic definitions
      ↓ compile
canonical semantic artifacts
      ↓
AllasCode Runtime — Zig 0.16
      ↓
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

## What this directory may contain

- TypeScript projections of Runtime contracts;
- in-memory registries and event buses for tests;
- graph loaders and validation helpers;
- flow/Action execution simulators;
- fixtures, mocks, adapters and sandbox implementations;
- evidence-producing test utilities.

## What this directory must not imply

- that Node.js is the AllasCode production Runtime;
- that TypeScript owns the canonical execution semantics;
- that TypeScript-specific interfaces are normative Runtime contracts;
- that absence of a capability in this harness means absence from the Zig Runtime;
- that generated JavaScript/TypeScript topology can override semantic definitions.

TypeScript implementations remain replaceable executable bindings and test projections only.
