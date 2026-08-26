# RegisterPurchase

Registers a supplier purchase that has already happened outside the system. The Action receives interpreted purchase data, resolves supplier and products, validates quantities and monetary values, and produces a semantic purchase record.

It does not modify inventory or financial state. Those responsibilities belong to later Actions in the flow.

Terminal results are only `Ok<PurchaseRegistered>` or `Error<PurchaseRegistrationError>`.
