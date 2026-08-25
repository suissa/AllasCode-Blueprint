# RegisterPurchase Schemas

Schemas describe only structural shape. They do not contain business behavior or healing logic.

## Files

- `input.yml` — input accepted by the Action: supplier identification, purchased items and declared total.
- `output.yml` — payload carried by `Ok<PurchaseRegistered>`.
- `error.yml` — payload carried by `Error<PurchaseRegistrationError>`.

Example input value:

```yaml
supplier:
  tax_id: "12.345.678/0001-90"
items:
  - product_label: "Coca-Cola Zero 2L"
    quantity: 6
    unit_cost: 8.50
purchase_total: 51.00
```

A schema answers "what is the shape of this value?"; semantic validity belongs to `../specifications/contract.yml` and to the invoked AtomicBehaviors.
