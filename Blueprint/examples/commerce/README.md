# Simple Commerce System — AllasCode Example

This directory is a definition-only example of a small commercial management system modeled with AllasCode. It intentionally contains no implementation language, framework, database driver, HTTP handler, or vendor-specific runtime code.

The business scenario is deliberately small: a merchant buys products from a supplier, sends the purchase evidence and description, the system records the purchase, increases inventory, records the financial outflow, later identifies a new sale, asks which products were sold when necessary, decreases inventory, and closes the sale financially.

## Business lifecycle

```text
Supplier purchase evidence
        ↓
PurchaseProductsIntent
        ↓
RegisterPurchase
        ↓ Ok
IncreaseStock ───────────────┐
        ↓ Ok                 │
RecordPurchaseExpense        │
        ↓ Ok                 │
PurchaseCompleted            │
                             │
Sale identified by terminal  │
        ↓                    │
ProcessSaleIntent            │
        ↓                    │
ResolveSaleProducts          │
        ↓ Ok                 │
DecreaseStock                │
        ↓ Ok                 │
CloseSale                    │
        ↓ Ok                 │
SaleCompleted                │
```

Every executable semantic action emits only two terminal result types: `Ok` and `Error`. Domain events may describe what happened after an `Ok`, but they do not replace the action result contract.

## Directory responsibilities

- `agents/`: semantic actors allowed to know and coordinate only their own domain context.
- `contexts/`: boundaries of knowledge available to each domain.
- `entities/`: business identities and their state-bearing properties.
- `actions/`: atomic domain operations with explicit input/output/error contracts.
- `atomicbehavior/`: reusable behavior types independent from a specific entity.
- `events/`: facts emitted after successful or failed semantic transitions.
- `intents/`: desired business outcomes initiated by a human or another system.
- `flows/`: choreography connecting events and actions without embedding implementation.
- `specifications/`: acceptance conditions and observable business examples.
- `formalization/`: invariants and laws that must remain true in every implementation.

## Governing rule

The example models **what the system means and how its parts relate**, not how a particular language executes it. A compiler/runtime may later project these definitions to TypeScript, Zig, Rust, Go, Python, actors, services, functions, queues, or another architecture without changing the semantic source.
