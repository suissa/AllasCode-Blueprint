# Flows

Flows describe choreography between Agents/Contexts using the AllasCode `2flow` notation. A Flow does not grant lower-level components knowledge of other contexts; only the Agent boundary exchanges results.

## Notation used

- `-> Event` — event enters the current Agent/Context.
- `<- Event` — event leaves the current Agent/Context.
- `->> Action` — the current Agent invokes an Action/behavior it owns.
- `<<- Action` — the current node is being invoked by its owner.

The semantic result of every invocation is still only `Ok<T>` or `Error<E>`. The payload carried by those result types identifies what happened in the domain.

## Files

- `purchase-products.2flow` — purchase evidence -> purchase registration -> stock entry -> financial entry.
- `sale-products.2flow` — card-machine sale detection -> merchant clarification -> product resolution -> stock exit -> sale close.

Every significant node explicitly branches for `Ok` and `Error`. An `Error` may carry `healing.human_required: true`; this does not create a third event type.
