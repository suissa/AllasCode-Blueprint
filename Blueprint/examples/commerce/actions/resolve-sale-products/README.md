# ResolveSaleProducts

Associates a sale identified by the payment/sale source with the products and quantities actually sold. It resolves semantic product identities before inventory is changed.

It does not decrease stock and does not close the financial sale.

Terminal results are only `Ok<SaleProductsResolved>` or `Error<SaleProductsResolutionError>`.
