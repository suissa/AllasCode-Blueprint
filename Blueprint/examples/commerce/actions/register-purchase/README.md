# RegisterPurchase Action

Registers a supplier purchase after the incoming evidence has already been interpreted into structured data.

## Files

- `manifest.yml` — semantic identity, public input/output/error schemas and referenced contract.
- `config.yml` — internal execution binding and runtime options.
- `schema/input.yml` — supplier, items and purchase evidence expected by the Action.
- `schema/output.yml` — payload returned inside `Ok<PurchaseRegistered>`.
- `schema/error.yml` — payload returned inside `Error<PurchaseRegistrationError>`.
- `specifications/contract.yml` — rules that must hold before and after execution.

## Example input

```yaml
supplier:
  tax_id: "12.345.678/0001-90"
items:
  - product_label: "Coca-Cola Zero 2L"
    quantity: 6
    unit_cost: 8.50
purchase_total: 51.00
```

## Example success

```yaml
kind: Ok
semantic: PurchaseRegistered
value:
  purchase_id: purchase:2026-0001
  supplier_id: supplier:12345678000190
  stock_entries: 1
```

The Action itself does not normalize arbitrary input. Any normalization required to establish conformity belongs to `validate` or to the self-healing pipeline of the invoked Semantic AtomicBehavior Type.
