# Buy One Product — canonical executable vertical slice

This use case models the human intent **"I want to buy one product"** as an AllasCode execution lineage rather than as an imperative command chain.

## Semantic lineage

```text
User/UI/Gateway
  -> BuyOneProductRequested
  -> Runtime resolves CheckoutAgent.BuyOneProduct
  -> Runtime executes the Behavior
  -> Runtime executes the supervised Atomic Actions required by the Behavior
  -> Agent/Behavior returns only an internal Result<Ok, Error>
  -> Runtime derives and emits CheckoutAgent.BuyOneProduct.Ok | CheckoutAgent.BuyOneProduct.Error
```

The initiating `trace_id` is created by the GatewayAgent, or by the UIAgent when the intent originates in the UI. Every execution record preserves the same `trace_id`; each emitted event receives its own `event_id` and direct `causation_id`.

## Runtime authority rule

Only the Runtime may execute a function. Agents, Actors, Behaviors and Actions describe executable semantics and return internal results; they do not publish events themselves.

For every Behavior `B` with canonical label `L`:

```text
Runtime.execute(B, input) -> InternalResult

InternalResult.Ok(value)
  => Runtime side effect: emit L.Ok(value)

InternalResult.Error(error)
  => Runtime side effect: emit L.Error(error)
```

Therefore event names are not configurable by implementation code and are not returned by Agent code. Event emission is an observable side effect of Behavior execution controlled exclusively by the Runtime.

Because an Action is a Semantic AtomicBehavior, the same rule applies recursively to Atomic Actions.

## Required artifacts

- Intent: `intents/buy-one-product.yml`
- Behavior: `behaviors/buy-one-product/manifest.yml`
- Flow: `flows/buy-one-product.2flow`
- Agent + Actor: `agents/checkout-agent/*`, `actors/checkout-actor/*`
- Atomic Actions: `actions/*/manifest.yml`
- Runtime execution contract: `runtime/*`
- Event derivation contract: `events/manifest.yml`
- Policy and invariants: `formalization/invariants.yml`
- Executable scenarios: `tests/scenarios.yml`

## Business contract

Input identifies exactly one product and quantity is fixed to `1`. The Runtime must resolve the product and authoritative price, reserve one stock unit, authorize payment, register the sale, and atomically commit the reservation. If a later step cannot complete, compensation runs before healing continues.

No Agent commands another Agent. The flow is a declarative execution plan interpreted by the Runtime; it is not imperative Agent-to-Agent invocation.

## Success

Success is observable only after all of the following are true:

1. product identity and price were resolved from authoritative data;
2. one stock unit was reserved;
3. payment was authorized for the resolved amount;
4. the sale was durably registered;
5. reservation became a committed stock decrement;
6. Event Sourcing contains the accepted transition chain.

The Agent/Behavior returns internal `Ok`. The Runtime then derives and emits `CheckoutAgent.BuyOneProduct.Ok`.

## Error semantics

The Agent/Behavior returns internal `Error`; it never emits `.Error` itself. The Runtime derives the canonical `.Error` event, records it, and routes the failure through compensation and Healing. If automatic healing cannot safely continue, the case becomes Human-in-the-Healing-Loop while preserving the same trace.