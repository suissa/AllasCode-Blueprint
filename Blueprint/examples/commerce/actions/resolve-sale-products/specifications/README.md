# ResolveSaleProducts Specifications

## Files

- `contract.yml` — preconditions, postconditions, invariants and failure semantics for sale-product resolution.

Example:

```yaml
postconditions:
  - on Ok<SaleResolved>: value.items.length > 0
```

If the merchant's declaration remains ambiguous after permitted self-healing, the Action returns `Error<SaleResolutionError>`; human clarification is metadata inside the Error payload, not a third result/event type.
