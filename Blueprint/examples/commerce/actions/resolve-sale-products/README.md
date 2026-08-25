# ResolveSaleProducts Action

Resolves the merchant's description of which products compose a sale previously detected by the payment/card machine.

## Files

- `manifest.yml` — public semantic identity and contract references.
- `config.yml` — internal bindings to product-resolution behaviors.
- `schema/input.yml` — detected sale plus merchant declaration.
- `schema/output.yml` — resolved sale items returned in `Ok<SaleResolved>`.
- `schema/error.yml` — semantic failure payload returned in `Error<SaleResolutionError>`.
- `specifications/contract.yml` — rules that must hold before/after resolution.

## Example input

```yaml
sale_id: sale:machine:9812
sale_total: 32.00
merchant_declaration: "2 coca zero 2 litros e 1 água"
```

## Example success

```yaml
kind: Ok
semantic: SaleResolved
value:
  sale_id: sale:machine:9812
  items:
    - product_id: product:coca-zero-2l
      quantity: 2
    - product_id: product:water
      quantity: 1
```

Ambiguity that cannot be safely healed returns `Error<SaleResolutionError>` with possible candidates and `healing.human_required: true`.
