---
name: buy-one-product-intent
description: Recognize and constrain the immutable intent to buy exactly one product.
---

# BuyOneProductIntent

Resolve this Intent when the user wants to purchase a single product unit. The product may initially be identified by canonical id, alias or natural-language reference, but the Runtime must resolve it to one active Product before any effect.

Quantity is semantically fixed to `1`. Client-supplied price is never authoritative. The Intent completes only through `CheckoutAgent.BuyOneProduct` and its Runtime-derived terminal event.
