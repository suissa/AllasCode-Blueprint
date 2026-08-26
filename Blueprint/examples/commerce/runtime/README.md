# Runtime

The TypeScript runtime is an execution projection of the compiled Semantic Graph.

## Architectural rule

The runtime does not reconstruct topology from `agents/`, `actors/`, `actions/`, `tools/`, `entities/`, `intents/`, `events/`, or `.2flow` files during execution. Those definitions are compile-time inputs used to produce `generated/semantic-graph.json`.

Runtime startup reads the compiled graph, validates it, projects Agent/Actor/Action/Tool topology from graph edges, then loads only the TypeScript executable bindings for Actions and Tools.

```text
semantic definitions
      ↓ compile
Semantic Graph
      ↓ runtime input
ExecutionKernel
      ↓
AgentRuntime → ActorSystem → ActionRegistry
      └───────────────→ ToolRegistry
```

Flows are executed from graph edges such as `IMPLEMENTS_INTENT`, `FLOW_CALLS_AGENT`, `FLOW_CALLS_ACTION`, `FLOW_EMITS_EVENT`, and `FLOW_EXPECTS_EVENT`; `.2flow` files are not read by `FlowRuntime`.

This keeps semantic definitions as source material, the graph as the compiled architectural artifact, and TypeScript implementations as replaceable executable bindings.
