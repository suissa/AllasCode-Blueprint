# Semantic Graph Healing

Healing is a runtime reaction to `Error<E>` after the Semantic Graph has already passed startup governance.

It is not permission to guess, silently coerce domain values, bypass policies, cross context boundaries, or mutate data until something works.

## Pipeline

```text
Action
  -> Error<E>
  -> semantic diagnosis
  -> inspect Action governance in the Semantic Graph
  -> choose only a reversible strategy
     -> Retry: same request, no semantic transformation
     -> Human: request missing context without inventing it
     -> Terminal: no safe graph-declared alternative
  -> Ok<T> or Error<E>
```

## Current reference strategies

- **Retry**: one retry for explicitly transient failures. The original event payload is preserved.
- **Human-in-the-Healing-Loop**: missing or ambiguous information is escalated with the original event and error evidence.
- **Terminal**: policy-, constraint-, or invariant-sensitive failures remain `Error<E>` when the graph declares no reversible alternative.

## Non-negotiable rules

1. Healing must be reversible.
2. Healing must preserve the original semantic intent.
3. Healing cannot bypass `Policy`, `Invariant`, `Law`, or `Constraint` nodes.
4. Healing cannot call another context directly; communication remains event-driven.
5. Normalization, when later introduced, belongs only to validation/healing and must itself be reversible.
6. A failed healing attempt does not create a third terminal result. Actions still expose only `Ok<T>` or `Error<E>`.

This first implementation deliberately does not search for alternate Actions or Tools yet. That requires explicit equivalence/substitution edges in the Semantic Graph; inferring equivalence from names would violate semantic governance.
