# RegisterPurchase Specifications

This folder contains semantic contracts for the Action.

## Files

- `contract.yml` — preconditions, postconditions, invariants and final failure semantics.

Example:

```yaml
preconditions:
  - items.length > 0
postconditions:
  - on Ok<PurchaseRegistered>: value.stock_entries == items.length
```

Specifications answer whether behavior is semantically correct. They are intentionally separate from schemas, which only describe structure.
