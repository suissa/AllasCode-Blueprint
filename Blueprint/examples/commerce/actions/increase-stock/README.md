# IncreaseStock

Applies a registered purchase to inventory. Each purchase item increases the corresponding product quantity exactly once for the same `purchase_id`.

Terminal results are only `Ok<StockIncreased>` or `Error<StockIncreaseError>`.
