# Commerce Actions

This directory is the golden-reference structure for AllasCode Actions in the commerce example.

Every Action MUST contain the same semantic contract:

- `README.md` — human explanation of purpose, inputs, outputs, events and invariants.
- `manifest.yml` — externally visible semantic identity and contract references.
- `config.yml` — internal configuration used to instantiate the Action.
- `schema/` — input, output, error and event payload definitions.
- `events/` — events listened to and emitted by the Action.
- `specifications/` — executable/declarative behavioral contract.
- `healing/` — reversible self-healing pipeline. Normalization is allowed only here or inside validation behaviors.
- `formalization/` — laws, rules, proof obligations and evidence.

An Action has exactly two terminal result types: `Ok<T>` and `Error<E>`. Domain events such as `PurchaseRegistered` or `StockDecreased` are payloads carried by those terminal result types, not additional terminal states.

No file in this example selects a programming language, framework, database or transport implementation.
