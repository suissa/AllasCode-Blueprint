# DecreaseStock

Applies resolved sold products to inventory. Each sale item decreases the corresponding product quantity exactly once for the same `sale_id`.

Terminal results are only `Ok<StockDecreased>` or `Error<StockDecreaseError>`.
