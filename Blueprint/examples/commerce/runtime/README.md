# TypeScript Runtime

This folder is the minimal executable projection for the commerce Blueprint. It is intentionally small and infrastructure-free.

- `definition-loader.ts` reads Action manifests from YAML.
- `action-registry.ts` binds `Agent.Action` semantic names to TypeScript implementations and verifies declared `Ok`/`Error` events.
- `flow-runtime.ts` interprets the subset of 2flow used by the example: `->`, `->>`, and `<-`.
- `event-bus.ts` records emitted events in memory.
- `state.ts` provides an in-memory state projection for purchases, inventory, sales, and financial entries.
- `bootstrap.ts` creates the bindings between semantic definitions and implementations.
- `demo.ts` executes the complete purchase and sale lifecycle.

The runtime is not the source of business meaning. It executes definitions already declared by the Blueprint.
