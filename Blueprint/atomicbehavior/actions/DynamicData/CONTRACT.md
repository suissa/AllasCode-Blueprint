# Dynamic data contract

A dynamic-data Action is not a generic tool wrapper. It accepts only bounded local
data plus a declarative plan, and it never runs user-supplied executable code.
An LLM may propose a plan, but validation resolves every field and operator
against the observed schema before execution.

Actions do not orchestrate another Action, retry themselves, synchronize,
publish, share, or mutate their source. They return evidence to the Runtime
self-healing pipeline whenever a precondition cannot be established.
