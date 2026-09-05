# DecreaseStockVerified

Alternative implementation of the same semantic stock-decrease capability used only when the Semantic Graph explicitly permits substitution/fallback.

It belongs to the same Inventory context, emits the same `Ok<StockDecreased>` / `Error<StockDecreaseError>` contract and must preserve every invariant/policy required by `DecreaseStock`.
