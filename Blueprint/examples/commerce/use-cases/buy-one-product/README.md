# Buy One Product — canonical executable vertical slice

This use case models the human intent **"I want to buy one product"** as an AllasCode execution lineage rather than as an imperative command chain.

## Semantic lineage

```text
User/UI/Gateway
  -> BuyOneProductRequested
  -> CheckoutAgent
  -> BuyOneProductIntent
  -> CheckoutAgent.BuyOneProduct
  -> supervised Atomic Actions
  -> CheckoutAgent.BuyOneProduct.Ok | CheckoutAgent.BuyOneProduct.Error
```

The initiating `trace_id` is created by the GatewayAgent, or by the UIAgent when the intent originates in the UI. Every event and action result in this slice preserves the same `trace_id`; every emitted event has its own `event_id` and points to its direct `causation_id`.

## Required artifacts

- Intent: `intents/buy-one-product.yml`
- Behavior: `behaviors/buy-one-product/manifest.yml`
- Flow: `flows/buy-one-product.2flow`
- Agent + Actor: `agents/checkout-agent/*`, `actors/checkout-actor/*`
- Atomic Actions: `actions/*/manifest.yml`
- Events: `events/manifest.yml`
- Policy and invariants: `formalization/invariants.yml`
- Executable scenarios: `tests/scenarios.yml`

## Business contract

Input identifies exactly one product and quantity is fixed to `1`. The runtime must resolve the product and authoritative price, reserve one stock unit, authorize payment, register the sale, and atomically commit the reservation. If a later step cannot complete, compensation runs before healing continues.

No Agent commands another Agent. `->>` in the 2flow denotes semantic dispatch by the runtime to the Action owned by the current Agent; cross-Agent coordination remains event choreographed.

## Success

Success is observable only after all of the following are true:

1. product identity and price were resolved from authoritative data;
2. one stock unit was reserved;
3. payment was authorized for the resolved amount;
4. the sale was durably registered;
5. reservation became a committed stock decrement;
6. Event Sourcing contains the accepted transition chain.

The terminal semantic event is `CheckoutAgent.BuyOneProduct.Ok`.

## Error semantics

Actions may emit `.Error`, but the user-facing Intent does not terminate as a raw technical error. The Supervisor routes failures through compensation and the Healing pipeline. If automatic healing cannot safely continue, the case becomes Human-in-the-Healing-Loop while preserving the same trace.