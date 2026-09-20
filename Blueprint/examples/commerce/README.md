# Simple Commerce System — Executable AllasCode Example

This directory is both a semantic reference and a minimal executable **TypeScript reference harness** for a small commercial management system.

> **Canonical Runtime:** the AllasCode Runtime is implemented in **Zig 0.16**. Nothing under this example's TypeScript `runtime/` directory defines or replaces the canonical Runtime. The TypeScript code exists only as an executable projection used to validate semantics, flows, contracts, tests, and generated artifacts.

The semantic files remain the source of truth. TypeScript code exists under `runtime/`, `tests/`, and each Action's `implementation/` folder only as a reference binding/harness. It must not be used as evidence that the production AllasCode Runtime is Node.js or TypeScript.

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

Every Action returns exactly one terminal result type: `Ok<T>` or `Error<E>`. In this reference harness, TypeScript bindings are used to exercise those contracts. Runtime semantics remain defined independently from the implementation language.

## Structure

- `agents/`: semantic actors and domain knowledge boundaries.
- `contexts/`: what each agent is allowed to know.
- `entities/`: domain identities and state-bearing concepts.
- `actions/`: semantic Actions plus optional TypeScript reference bindings under `implementation/`.
- `atomicbehavior/`: reusable behavior definitions.
- `events/`: domain event definitions.
- `intents/`: desired outcomes.
- `flows/`: executable `.2flow` choreography.
- `specifications/`: behavioral contracts.
- `formalization/`: invariants and laws.
- `runtime/`: TypeScript **reference execution harness** used only by this example.
- `tests/`: executable acceptance checks for the semantic model and reference bindings.

## Canonical runtime boundary

```text
Semantic definitions / 2flow / contracts
              ↓ compile
      canonical semantic artifacts
              ↓
     AllasCode Runtime — Zig 0.16
              ↓
 Agent / Actor / Action execution
```

The TypeScript harness sits beside this architecture for validation:

```text
Semantic definitions
      ↓
TypeScript reference harness
      ↓
contract / graph / acceptance tests
```

It is not the production execution authority.

## Run the reference harness

From `Blueprint/examples/commerce`:

```bash
npm install
npm run check
npm test
npm run demo
```

These commands run the TypeScript reference harness and test suite. They do not start the canonical Zig Runtime.

The demo runs a supplier purchase followed by a sale. State is intentionally in memory so that the example demonstrates AllasCode semantics without coupling the reference harness to a database, web framework, queue, container platform or cloud provider.

## What is definition-driven

The reference harness consumes compiled/declared semantic topology to validate Action order, expected events, Agent/Action ownership and acceptance constraints. TypeScript orchestration in this example is replaceable and must remain semantically subordinate to the Blueprint definitions and the canonical Zig Runtime contract.

## Deliberate limitations

This example is small by design. It does not attempt to reimplement the complete Zig Runtime, including the full Intake → Resolver → Binding → Healing → Proof → Governor → Orchestration → Acceptance → Persistence pipeline. Missing capabilities in the TypeScript harness are therefore not missing architectural capabilities of AllasCode itself.
