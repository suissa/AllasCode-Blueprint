# Simple Commerce System — Executable AllasCode Example

This directory is both a semantic reference and a minimal executable TypeScript projection of a small commercial management system.

The semantic files remain the source of truth. The TypeScript code exists only under `runtime/`, `tests/`, and each Action's `implementation/` folder. The runtime reads the `.2flow` choreography and Action `manifest.yml` files instead of hard-coding the workflow order or accepted domain events.

## Business lifecycle

```text
Supplier purchase
  -> PurchaseProductsRequested
  ->> PurchaseAgent.RegisterPurchase
  <- PurchaseRegistered
  ->> InventoryAgent.IncreaseStock
  <- StockIncreased
  ->> FinancialAgent.RecordPurchaseExpense
  <- PurchaseCompleted

Detected sale
  -> SaleIdentified
  ->> SalesAgent.ResolveSaleProducts
  <- SaleProductsResolved
  ->> InventoryAgent.DecreaseStock
  <- StockDecreased
  ->> FinancialAgent.CloseSale
  <- SaleCompleted
```

Every Action returns exactly one terminal result type: `Ok<T>` or `Error<E>`. The runtime verifies that the event emitted by the TypeScript implementation matches the event declared in that Action's `manifest.yml`.

## Structure

- `agents/`: semantic actors and domain knowledge boundaries.
- `contexts/`: what each agent is allowed to know.
- `entities/`: domain identities and state-bearing concepts.
- `actions/`: semantic Actions plus their TypeScript projection under `implementation/`.
- `atomicbehavior/`: reusable behavior definitions.
- `events/`: domain event definitions.
- `intents/`: desired outcomes.
- `flows/`: executable `.2flow` choreography.
- `specifications/`: behavioral contracts.
- `formalization/`: invariants and laws.
- `runtime/`: minimal TypeScript runtime, registry, manifest loader, event bus and flow interpreter.
- `tests/`: executable acceptance checks.

## Run

From `Blueprint/examples/commerce`:

```bash
npm install
npm run check
npm test
npm run demo
```

The demo runs a supplier purchase followed by a sale. State is intentionally in memory so that the example demonstrates AllasCode semantics without coupling the reference to a database, web framework, queue, container platform or cloud provider.

## What is definition-driven

The runtime reads `flows/*.2flow` to determine Action order and expected events. Each Action is resolved through `Agent.Action`, and the registry loads the corresponding `manifest.yml` to validate its declared `Ok` and `Error` event names. This means changing the flow choreography changes runtime ordering without rewriting the TypeScript orchestrator.

## Deliberate limitations

This example is small by design. It does not yet implement schema validation, the full self-healing pipeline, persistence adapters, concurrency control, durable event sourcing, external integrations or a compiler from arbitrary Blueprint definitions. Those are runtime capabilities, not business semantics, and can be added without changing the commerce model itself.
