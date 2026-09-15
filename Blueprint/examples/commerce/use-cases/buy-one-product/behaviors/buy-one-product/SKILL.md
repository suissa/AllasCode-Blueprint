---
name: buy-one-product
description: Execute the complete one-product purchase Behavior under Runtime authority.
---

# CheckoutAgent.BuyOneProduct

This composite Behavior fulfills `BuyOneProductIntent` for exactly one product unit.

Order: resolve product → resolve authoritative price → reserve one stock unit → authorize payment → register sale → commit reservation.

The implementation never emits `Ok` or `Error`. It returns an internal result. Runtime derives the public event strictly as `CheckoutAgent.BuyOneProduct.Ok` or `CheckoutAgent.BuyOneProduct.Error` and emits it as the execution side effect.

If an effect after reservation fails, execute the required compensations before Runtime publishes terminal `Error` and transfers control to Healing.
