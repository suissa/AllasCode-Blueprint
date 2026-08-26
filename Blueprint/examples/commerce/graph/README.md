# Commerce Semantic Graph

This directory defines the canonical graph artifact produced from the commerce Blueprint.

The graph is **compiled**, not authored. The source of truth remains the semantic definitions in `entities/`, `intents/`, `events/`, `agents/`, `actors/`, `actions/`, `tools/`, `flows/` and the active composition declared in `config.yml`.

The compiler converts those definitions into one directed, typed graph containing nodes for `Entity`, `Intent`, `Event`, `Agent`, `Actor`, `Action`, `Tool` and `Flow` and typed edges describing ownership, permissions, relations, flow calls and event expectations.

Only flows referenced by `config.yml#flows` are part of the executable graph. Other `.2flow` files may remain in the repository as examples, experiments or historical references without becoming part of the active architecture.

The graph is deterministic: identical semantic definitions must produce identical nodes and edges regardless of filesystem enumeration order.

## Commands

- `npm run graph:validate` compiles the graph in memory and validates graph invariants.
- `npm run graph:build` writes the compiled graph to `generated/semantic-graph.json` for inspection or later runtime consumption.

The runtime does not consume the compiled graph yet. That is intentionally a separate migration step so the graph can first become a stable, validated contract.
