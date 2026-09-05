# RecordPurchaseExpense

Records the financial consequence of a completed supplier purchase. It creates the expense correlation required by the purchase lifecycle without changing inventory.

Terminal results are only `Ok<PurchaseExpenseRecorded>` or `Error<PurchaseExpenseRecordingError>`.
