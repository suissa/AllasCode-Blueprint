# Intents

Intents describe desired business outcomes. They do not prescribe a fixed implementation architecture; the runtime may realize the same intent with different Agents, Actions, transports or deployment topologies as long as the semantic contract remains satisfied.

## Files

- `purchase-products.yml` — outcome for registering a supplier purchase and increasing stock.
- `sell-products.yml` — outcome for resolving a detected sale, decreasing stock and closing the sale.

Each Intent declares:

- `name` / `semantic_id` — stable semantic identity.
- `purpose` — business outcome.
- `starts_when` — semantic trigger.
- `requires` — facts that must exist.
- `succeeds_when` — observable completion condition.
- `flow` — one available choreography that can realize the intent.

Example:

```yaml
name: PurchaseProducts
purpose: register_supplier_purchase_and_make_stock_available
starts_when: PurchaseEvidenceReceived
succeeds_when:
  - PurchaseRegistered
  - StockEntryCommitted
```
