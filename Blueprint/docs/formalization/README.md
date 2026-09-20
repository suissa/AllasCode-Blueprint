# Formalization

Laws, rules, proofs, and evidence for the semantic model.

## Normative proposals

- [Behavior-Oriented Actor Model](./BEHAVIOR_ORIENTED_ACTOR_MODEL.md) — formalizes the AllasCode relation between Agent, Intent, Behavior, Actor, Action, Event choreography, state ownership, capabilities, supervision, healing, and proof obligations.

## Executable/formal artifacts

- `../../formalization/laws/behavior-oriented-actor.law`
- `../../formalization/rules/behavior-oriented-actor.rule`
## Runtime behavior execution

`Blueprint/formalization/laws/runtime-behavior-execution.law` freezes the rule that only the Runtime executes functions and that public `Agent.Intent.Ok|Error` events are derived automatically from the internal Behavior result and emitted by the Runtime as a side effect of execution.
