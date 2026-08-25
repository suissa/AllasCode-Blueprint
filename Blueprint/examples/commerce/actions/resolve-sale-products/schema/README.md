# ResolveSaleProducts Schemas

Schemas describe data shape only.

## Files

- `input.yml` — detected sale identifier, detected total and the merchant's declaration.
- `output.yml` — resolved item list returned in `Ok<SaleResolved>`.
- `error.yml` — error details and optional candidates returned in `Error<SaleResolutionError>`.

Example input:

```yaml
sale_id: sale:machine:9812
sale_total: 32.00
merchant_declaration: "2 coca zero 2 litros e 1 água"
```

Whether those values are semantically valid is decided by the contract and the invoked Semantic AtomicBehaviors, not by the schema alone.
