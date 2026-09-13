# Contextual Behavioral Identity

Contextual Behavioral Identity is compiler step `4.5`, executed after Semantic Identity Resolution and before Runtime Topology generation.

```text
Semantic Identity
  -> Contextual Identity Coupling
  -> Behavioral Identity Resolution
  -> Behavioral Completion Proofs
  -> Runtime Topology
```

## Identity layers

| Layer | Question | Result |
| --- | --- | --- |
| Semantic Identity | How is this entity recognized? | `semantically_identified` |
| Behavioral Identity | Can this entity participate in this behavior? | `behaviorally_partial` or `behaviorally_concretized` |
| Contextual Identity Coupling | Which identities complete each other in this context? | graph edges and proof dependencies |
| Canonical Characteristic | Which semantic property bridges identities? | coupling point, identity bridge, theorem dependency |

An entity may exist semantically before it exists behaviorally. For example, a `User` with `email`, `cpf`, `phone`, and `name` is recognized, but remains partial for `CheckoutBehavior` until `AddressIdentity`, `PaymentIdentity`, `ProductIdentity`, `StockIdentity`, and `SessionIdentity` are coupled.

## DSL surface

```text
behavioral_identity StockBehavioralIdentity {
  context Stock

  couples {
    Product.sku
    Warehouse.location
  }

  provides {
    Stock.contextually_complete
  }
}
```

```text
behavioral_identity CheckoutBehavioralIdentity {
  context Order.Checkout

  requires_identity {
    UserIdentity
    ProductIdentity
    StockIdentity
    PaymentIdentity
    AddressIdentity
  }

  provides {
    Order.contextually_complete
  }
}
```

## Compiler module

The executable reference implementation lives in `src/compiler/behavioral-identity`.

Main entrypoint:

```js
import { deriveBehavioralIdentity } from "../../../src/compiler/behavioral-identity/index.mjs";
```

The resolver emits:

- derived canonical characteristics;
- contextual coupling graph edges;
- identity completion states;
- proof obligations for coupling and contextual completion;
- runtime topology nodes and edges.

## Required semantics

A `canonical_characteristic` is not a common property. It is treated as:

- semantic coupling point;
- identity bridge;
- behavioral completion requirement;
- graph edge source;
- theorem dependency;
- convergence participant.

