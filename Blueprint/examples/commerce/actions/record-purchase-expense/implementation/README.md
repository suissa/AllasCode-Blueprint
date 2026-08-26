# RecordPurchaseExpense TypeScript Projection

`implementation.ts` calculates the purchase total and records one idempotent financial expense entry. On success it emits `PurchaseCompleted`, matching the Action manifest and purchase flow.
