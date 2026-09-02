# Flows

Flows describe choreography between Agents/Contexts using the AllasCode `2flow` notation.

The examples in this folder use the two levels defined in [`Blueprint/2flow.md`](../../../2flow.md):

1. **Topological 2flow** — `:--:`, `!->`, `[...]`, `[? ...]` describe causal sequence, compensation/fallback, concurrency and human gates.
2. **Execution 2flow** — `->`, `<-`, `->>`, `<<-` describe event ingress/egress and invocation of functions owned by an Agent.

A Flow does not grant lower-level components knowledge of other contexts. Cross-context knowledge is exchanged only through the Agent boundary.

## Topological notation

```2flow
A :--: B
```

`B` is enabled after the successful causal result of `A`.

```2flow
A !-> RecoverA
```

An `Error<E>` from `A` may activate the declared recovery/fallback/compensation node. `!->` is a graph edge; it is not a new result type.

```2flow
A :--: [B, C] :--: D
```

`B` and `C` form a parallel fork/join before `D`.

```2flow
A :--: [? HumanApproval] :--: B
```

Execution waits for external human evidence before continuing.

## Execution notation

- `-> Event` — an event/result enters the current Agent or execution scope.
- `<- Event` — an event/result leaves the current Agent or execution scope.
- `->> Function` — the current Agent invokes a function/Action/AtomicBehavior it owns.
- `<<- Function` — that owned function receives/is being invoked by its owner.

Example:

```2flow
execution StockAgent.DecreaseStock
  -> Ok<SaleResolved>
  ->> DecreaseStock
  <<- DecreaseStock

  Ok<StockExitCommitted>
    <- Ok<StockExitCommitted>

  Error<StockExitError>
    <- Error<StockExitError>
```

The result algebra remains strictly:

```text
Ok<T> | Error<E>
```

`SaleResolved`, `StockExitCommitted`, etc. are semantic payload types, not additional event families.

## Self-healing rule

Semantic AtomicBehaviors already include self-healing. Normalization may exist only inside `validate` or `self-healing`; it is not a generic Flow or domain-behavior stage.

A final `Error<E>` means the permitted healing strategies could not establish the required contract or that external/human evidence is required.

## Files

- `purchase-products.2flow` — purchase evidence -> purchase registration -> stock entry -> financial entry, with a high-level topology followed by the low-level executable event/function wiring for each node.
- `sale-products.2flow` — sale polling -> merchant clarification -> product resolution -> stock exit -> sale close, using the same two-level representation.
