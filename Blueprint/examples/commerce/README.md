# Commerce Management Example

This directory is a complete semantic example of a small commerce-management system modeled with AllasCode.

The example covers two main business intentions:

1. **Purchase products** — the merchant sends purchase evidence (image/Pix receipt) and a description or audio; the system identifies supplier, products, quantities and unit costs, then records the stock entry and its financial consequence.
2. **Sell products** — the system detects a new card-machine sale, asks which products were sold, resolves the answer, commits the stock decrease and closes the sale.

## Architectural rule

The example separates semantic identity, internal configuration, contracts and orchestration:

- `manifest.yml` — what the system exposes and semantically declares.
- `config.yml` — internal values used to instantiate and execute the system.
- `contexts/` — boundaries of knowledge.
- `entities/` — domain identities and invariants.
- `actions/` — independently identifiable and invocable domain actions.
- `atomicbehavior/` — smallest semantic behavior types.
- `intents/` — desired outcomes that organize actions.
- `flows/` — choreography between contexts/agents through events.
- `events/` — shared event result algebra. Every function emits only `Ok<T>` or `Error<E>`.
- `specifications/` — behavioral rules independent from implementation.
- `formalization/` — optional machine-verifiable laws and proofs.

Every internal directory contains its own `README.md` explaining the purpose of each file and showing concrete values.

## Execution principle

```text
Input
  -> Intent
  -> Agent / Context
  -> Action
  -> Semantic AtomicBehavior
       -> validate
            -> normalization (only when needed by validation)
       -> behavior
       -> validate output
       -> self-healing on non-conformance
            -> normalization/transformation
            -> revalidate
       -> Ok<T> | Error<E>
  -> next Agent through emitted event
```

Self-healing is part of the Semantic AtomicBehavior contract, not an optional middleware. Automatic corrective transformations must preserve enough information to be reversible or auditable.

## Start here

Read `manifest.yml` and `config.yml` first, then follow `flows/purchase-products.2flow` and `flows/sale-products.2flow` to see how the complete example is connected.
