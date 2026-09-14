# Contextual Behavioral Identity

Contextual Behavioral Identity is compiler step `4.5`, after Semantic Identity
Resolution and before Runtime Topology generation.

A semantic identity answers whether one entity can be recognized. A contextual
behavioral identity answers whether identities from distinct entities have been
coupled, inside one exact behavior context, so that the entity can exhibit that
behavior completely.

## Normative derivation

For canonical participant paths `P` and context `C`, the compiler derives:

```text
contextual_identity_id = "cbi:sha256:" + SHA-256(
  canonical-json({ context: C, participants: sort(P) })
)
```

Participant order therefore does not alter identity, while changing the context
or a participant does. A valid coupling MUST:

- declare a non-empty name and context;
- contain at least two canonical characteristics;
- join at least two distinct entities;
- reference properties actually declared by those entities;
- remain isolated from couplings in every other context.

Invalid or unresolved couplings are fail-closed: they remain
`behaviorally_partial`, produce failed proof obligations and diagnostics, and
MUST NOT be projected into runtime topology.

## Identity states

| Scope | States |
| --- | --- |
| Entity semantic identity | `semantically_identified`, `semantically_partial` |
| Contextual coupling | `behaviorally_concretized`, `behaviorally_partial` |
| Behavior completion | `contextually_complete`, `behaviorally_partial` |

Semantic state is emitted per entity. The aggregate is
`semantically_identified` only when every entity is identified.

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
    SessionIdentity
  }
  provides {
    Order.contextually_complete
  }
}
```

A required identity is satisfied only by a concretized coupling with the exact
same context. A similarly named identity from another context cannot complete
the behavior.

## Compiler evidence

The executable implementation is in `src/compiler/behavioral-identity`.
`deriveBehavioralIdentity(entityIR)` emits:

- per-entity semantic states and canonical characteristics;
- deterministic, context-bound composite identity IDs;
- resolved coupling edges only;
- explicit unresolved dependencies and diagnostics;
- behavior completion states;
- proof obligations with SHA-256 evidence digests.

A proof is `proved` only when its complete obligation holds. Missing
characteristics, structural violations, unresolved requirements, or partial
semantic identity produce `failed`, never an inconclusive success.
