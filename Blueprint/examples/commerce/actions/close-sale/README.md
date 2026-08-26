# CloseSale

Finalizes the financial representation of a sale after its products have been resolved and inventory has been decreased. It correlates the external sale with the completed domain sale.

Terminal results are only `Ok<SaleCompleted>` or `Error<SaleCloseError>`.
