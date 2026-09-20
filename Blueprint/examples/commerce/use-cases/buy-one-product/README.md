# Buy One Product — canonical executable vertical slice

This use case models the human intent **"I want to buy one product"** as an AllasCode execution lineage driven by an Intent 2flow.

## Runtime authority

Only the Runtime executes functions. Actions do not call one another and Agents do not imperatively command one another.

The semantic sequence is:

```text
Runtime executes Action
  -> Action produces Ok | Error
  -> Runtime materializes that result as an Agent-local Action event
  -> owning Agent consumes the Action event
```

The `Ok` and `Error` therefore **originate semantically from the Action execution**, even though the Runtime is the publication authority.

## Ok path

An Action `Ok` is not automatically an Agent `Ok`.

After every Action `Ok`, the Runtime reads the current Agent's position in the Intent 2flow:

```text
Action.Ok
  -> remaining Action exists
       -> Runtime executes next Action
  -> no remaining Action exists
       -> Runtime emits CheckoutAgent.BuyOneProduct.Ok
```

`CheckoutAgent.BuyOneProduct.Ok` is therefore evidence that the Agent's portion of the Intent 2flow is exhausted successfully.

## Error path

An Action `Error` is consumed first by the owning Agent:

```text
Action.Error
  -> Agent receives local Error
  -> mandatory self-healing pipeline
       -> healed: Runtime resumes execution
       -> exhausted: Runtime publishes CheckoutAgent.BuyOneProduct.Error
```

The public Agent `Error` does not exist before the final stage of self-healing is exhausted.

## Dynamic cross-Agent wiring

An Agent source config contains no hard-coded foreign Agent name.

When the Intent 2flow is read to instantiate the runtime Agents, the predecessor relationship is derived from the flow and injected into the Agent runtime instance:

```text
Intent.2flow
  A -> B

Runtime creates B with:
  previous_agent = "A"
```

That injected `previous_agent` is the **only foreign Agent identity visible to B**. It is runtime-only and is never persisted in B's authored config.

It is used for two things:

1. B subscribes to `A.<Intent>.Ok` to know when its part of the flow may start.
2. If B exhausts self-healing, `B.<Intent>.Error` is routed back to A.

B does not need to know the name of any downstream Agent. Successful continuation is event choreography: downstream Agents are themselves instantiated with their own predecessor binding from the same 2flow.

## Purchase actions

```text
ResolveProduct
ResolveAuthoritativePrice
ReserveOneStockUnit
AuthorizePayment
RegisterSale
CommitStockReservation
```

Compensation Actions are available for reversible effects:

```text
ReleasePaymentAuthorization
ReleaseStockReservation
```

## Trace lineage

The initiating `trace_id` is created by the GatewayAgent, or by the UIAgent when the Intent originates in the UI. Action-local events, healing activity and public Agent completion events preserve that trace. Each emitted event has its own `event_id` and direct `causation_id`.

## Canonical rules demonstrated

- Runtime is the only function execution authority.
- Action execution is the semantic origin of local `Ok | Error` events.
- Action `Ok` advances the 2flow; it does not by itself mean Agent success.
- Agent `Ok` exists only when the Runtime proves that no Action remains for that Agent in the Intent 2flow.
- Action `Error` is handled by the owning Agent's self-healing pipeline.
- Agent `Error` exists only after self-healing is exhausted and is routed to the dynamically injected predecessor.
- Foreign Agent identities are never hard-coded in Agent source configuration.
- Runtime Agent wiring is derived exclusively from the Intent 2flow.
