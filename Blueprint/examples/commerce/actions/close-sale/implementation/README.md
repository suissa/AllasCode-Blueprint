# CloseSale TypeScript Projection

`implementation.ts` closes a sale only after inventory has been decreased. It records the revenue entry idempotently and emits the `SaleCompleted` event declared by the Action manifest.
