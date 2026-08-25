# Events

This folder defines the universal result protocol used by every invocable function in the commerce example.

There are only two event types:

- `Ok<T>` — the behavior satisfied its contract and produced a valid result.
- `Error<E>` — the behavior could not satisfy its contract after the allowed validation and self-healing attempts.

Domain-specific outcomes such as `ProductResolved`, `SaleClosed` or `SupplierCreated` are not new event types. They are semantic payloads carried inside `Ok<T>` or `Error<E>`.

## Files

### `result.yml`

Declares the common discriminated result union and the metadata every result may carry.

Example:

```yaml
kind: Ok
semantic: ProductResolved
value:
  product_id: product:coca-cola-zero-2l
```

Or:

```yaml
kind: Error
semantic: ProductResolutionFailed
error:
  code: AMBIGUOUS_PRODUCT
```
