# Actions

Actions are independently identifiable and invocable domain operations. Each action owns one semantic responsibility, declares its internal configuration in `config.yml`, exposes its identity and outward contract in `manifest.yml`, and defines schemas/specifications in its own directory.

For this example the purchase path uses `RegisterPurchase`, `IncreaseStock`, and `RecordPurchaseExpense`; the sale path uses `ResolveSaleProducts`, `DecreaseStock`, and `CloseSale`.

Every action emits exactly one terminal result: `Ok` or `Error`. A successful `Ok` may carry the domain event that continues the choreography.
