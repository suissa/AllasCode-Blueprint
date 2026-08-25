# Entities

Entities represent durable domain identities. They declare semantic identity, properties and invariants, but do not contain orchestration.

## Files

- `supplier.yml` — identifies the supplier that sold the goods.
- `product.yml` — canonical commercial product identity.
- `stock.yml` — current physical quantity of a product.
- `sale.yml` — commercial sale detected or confirmed.
- `payment.yml` — financial settlement associated with a purchase or sale.

Each entity file contains:

- `name` / `semantic_id` — stable semantic identity.
- `properties` — data that characterizes the identity.
- `invariants` — rules that must always remain true.

Example:

```yaml
name: Stock
properties:
  product_id: ProductId
  quantity: Quantity
invariants:
  - quantity >= 0
```

An Entity does not decide how to change itself. An Action invokes AtomicBehaviors that produce a valid new state or `Error<E>`.
