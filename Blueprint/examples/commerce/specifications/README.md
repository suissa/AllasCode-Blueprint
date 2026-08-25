# Specifications

Specifications define semantic rules independently from implementation language, transport or deployment architecture.

They answer questions such as:

- What must be true before an operation?
- What must be true after `Ok<T>`?
- Which invariants can never be violated?
- When must the runtime stop automatic healing and return `Error<E>`?

## Files

- `system.yml` — cross-cutting laws for the complete commerce example.

Example rule:

```yaml
result_algebra:
  allowed:
    - Ok
    - Error
```

A specification is not a schema. Schema describes the structural shape of data; specification describes semantic truth and behavior.
