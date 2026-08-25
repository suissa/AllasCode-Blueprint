# Contexts

Contexts define knowledge boundaries. An Agent may reason only with the entities, actions and data exposed by its own context. Cross-context communication occurs through emitted `Ok<T>` / `Error<E>` results, not by directly reaching into another context's internals.

## Files

- `procurement.yml` — supplier purchase knowledge and purchase-entry actions.
- `stock.yml` — physical inventory knowledge and stock mutations.
- `financial.yml` — payment, sale-machine and financial-record knowledge.
- `sales.yml` — sale composition and closing knowledge.

Each file declares the context's semantic identity, entities it owns or observes, actions it exposes, and events it may receive.

Example:

```yaml
name: Stock
owns:
  - Stock
observes:
  - Product
accepts:
  - Ok<PurchaseRegistered>
```
