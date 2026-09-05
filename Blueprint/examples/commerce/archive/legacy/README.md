# Legacy semantic contracts

This directory preserves superseded commerce contracts for historical reference only.

Files under `archive/legacy` are intentionally outside the active compiler inputs. The v1 semantic graph compiles active Intent declarations only from `intents/*.yml` and active Flow declarations only from the paths configured in `config.yml`.

## SellProducts

`SellProducts` and `sale-products.2flow` were an early, untyped sale lifecycle. They are archived because the executable v1 contract is now `ProcessSaleIntent` implemented by the configured `process-sale` flow.

The archived contract MUST NOT be reintroduced into `intents/` or `config.yml` without a new semantic change review and Semantic Merge Gate approval.
