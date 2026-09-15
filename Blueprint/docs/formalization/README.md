# Formalization

Laws, rules, proofs, and evidence for the semantic model.

## Runtime behavior execution

`Blueprint/formalization/laws/runtime-behavior-execution.law` freezes the rule that only the Runtime executes functions and that public `Agent.Intent.Ok|Error` events are derived automatically from the internal Behavior result and emitted by the Runtime as a side effect of execution.
