# Semantic Governance

This directory declares the normative relationships that must be present in the compiled Semantic Graph before the commerce runtime may start.

Governance is not runtime business logic. It states which contexts contain Agents, which capabilities Actions require, which policies govern them, which invariants Actions must preserve, which laws Flows preserve and which constraints protect invariants.

`catalog.yml` is compiled into first-class graph nodes and typed edges. Entity properties and Action event schemas are derived automatically from their existing definitions, so they do not need to be repeated here.

The startup `SemanticGovernor` validates the compiled graph before registries, Actors or Agents are materialized. A structurally valid graph can still be rejected when its governance relations are incomplete.

Important distinction:

- **Policy**: conditional governance over a decision or operation.
- **Invariant**: a truth that must remain valid through every permitted state transition.
- **Law**: a system-level semantic property independent of implementation.
- **Constraint**: a bound on a specific operation that protects one or more invariants.
- **Capability**: a semantic ability required by an Action and implemented by an Actor or Tool.
- **Context**: the knowledge boundary to which an Agent is bound.
- **Property**: an observable constituent of an Entity, derived from `entities/*/properties.yml`.
- **Schema**: the contract validating an emitted Event, derived from each Action manifest.
