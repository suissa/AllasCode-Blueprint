# TypeScript Runtime Projection

This directory is the executable TypeScript projection of the semantic commerce Blueprint.

The runtime does not own the application topology. `semantic-loader.ts` discovers Agents, Actors, Tools and Actions from the definition directories and reads their YAML contracts at startup. TypeScript supplies execution mechanics only.

The execution path is:

```text
.2flow
  -> FlowRuntime
  -> AgentRuntime
  -> ActorSystem
  -> ActionRegistry
  -> Action implementation
  -> Ok<T> | Error<E>
```

Tools are independently resolved through `AgentRuntime -> ToolRegistry`. Agent permissions come from each Agent's `capabilities.yml`; Actor action sets and mailbox capacities come from Actor definitions; Action result contracts come from Action manifests.

## Projection convention

For this TypeScript example, executable Actions and Tools are discovered under `implementation/implementation.ts` (compiled/resolved as `.js` by the TypeScript runtime). The semantic identity, ownership, allowed capabilities, mailbox behavior and event contracts are not encoded in the TypeScript registry.

This means adding or removing an Agent/Actor/Tool/Action relationship should be expressed in the Blueprint YAML first. The runtime rebuilds the execution topology from those definitions on startup.
