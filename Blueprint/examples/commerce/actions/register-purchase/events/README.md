# Events

Declares the semantic event boundary of `RegisterPurchase`. The Action listens for one request event and emits exactly one terminal result: `Ok<PurchaseRegistered>` or `Error<PurchaseRegistrationError>`.
