# Commerce Semantic Graph

This directory defines the canonical graph artifact produced from the commerce Blueprint.

The graph is **compiled, not authored**. The source of truth remains the semantic definitions in `entities/`, `intents/`, `events/`, `agents/`, `actors/`, `actions/`, `tools/`, `flows/` and the active composition declared in `config.yml`.

The compiler converts those definitions into one directed, typed graph containing nodes for `Entity`, `Intent`, `Event`, `Agent`, `Actor`, `Action`, `Tool` and `Flow`.

## Event choreography

Agents do not call or access other Agents or their contexts. An Agent declares only the Events it chooses to listen to. An Action emits an Event. The event bus publishes that Event, and the graph identifies any Agents that declared a listener for it.

The executable graph therefore contains choreography edges such as:

- `Action --EMITS_OK--> Event`
- `Agent --LISTENS--> Event`
- `Event --DISPATCHES--> Action`

`DISPATCHES` does not mean the producer calls the consumer. It is the compiled representation of a listener declaration: when that Event is published, the listening Agent may dispatch the declared Action inside its own context through its own Actor.

For example:

```text
Action:RegisterPurchase
  --EMITS_OK--> Event:PurchaseRegistered

Agent:InventoryAgent
  --LISTENS--> Event:PurchaseRegistered

Event:PurchaseRegistered
  --DISPATCHES--> Action:IncreaseStock
```

The producer of `PurchaseRegistered` has no knowledge of `InventoryAgent`.

## Startup validation

Before execution, the compiled graph is rejected when the active choreography is inconsistent. Validation checks include:

- every listener references a declared Event;
- every dispatched Action is allowed by and owned by the listening Agent;
- every active Flow has an initial Event with at least one listener;
- every non-terminal successful Action Event used by an active Flow has a downstream listener;
- graph edges never reference missing nodes.

This is startup validation. Runtime authorization is not used to simulate direct cross-context access because direct cross-context access is not part of the architecture.

## Active flows

Only flows referenced by `config.yml#flows` are part of the executable graph. Other `.2flow` files may remain as examples, experiments or historical references without becoming part of the active architecture.

The `.2flow` declaration is compiled into graph evidence and flow boundaries. At runtime the sequence is driven by Events and listeners, not by an imperative list of Agent calls.

## Commands

- `npm run graph:validate` compiles the runtime graph in memory and validates its invariants and event choreography.
- `npm run graph:build` writes the graph to `generated/semantic-graph.json`.

The runtime consumes `generated/semantic-graph.json` as its architectural input. TypeScript implementations remain executable bindings only.
