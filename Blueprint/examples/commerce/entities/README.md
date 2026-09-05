# Commerce Entities

The commerce example models eight semantic entities: `Supplier`, `Product`, `Purchase`, `Inventory`, `Stock`, `Sale`, `Payment`, and `Financial`.

The root `*.yml` files remain compact summaries for navigation and backwards compatibility. Each entity also has a detailed directory that is the normative domain specification:

```text
<entity>/
├── README.md
├── manifest.yml
├── properties.yml
├── intents.yml
├── flows.yml
├── policies.yml
├── invariants.yml
└── laws.yml
```

Properties describe observable state. Intents describe valid goals involving the entity. Flows declare where the entity participates in system choreography. Policies govern conditional decisions. Invariants are propositions that must always hold in valid state. Laws are implementation-independent behavioral/formal rules that must hold across every runtime projection.

## Domain boundaries

- `Product` describes the item; it never owns authoritative quantity.
- `Stock` owns the authoritative quantity for one Product in one Inventory.
- `Inventory` governs Stock behavior and serializes accepted inventory mutations.
- `Purchase` records acquisition facts and causes stock/financial effects through events.
- `Sale` records selling facts and cannot complete before product resolution and stock effect.
- `Payment` records monetary settlement evidence and is not synonymous with Sale.
- `Financial` owns append-only economic entries and projections.
- `Supplier` owns supplier identity and descriptive data only.

No entity is allowed to mutate another entity's state directly. Cross-context consequences happen through declared Actions and events.
