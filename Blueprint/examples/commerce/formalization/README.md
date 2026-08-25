# Formalization

Formalization is optional and exists to express semantic laws in a machine-checkable or mathematically explicit form. It is not the implementation of the Action or AtomicBehavior.

## Files

- `laws.md` — human-readable formal laws used by this example.

The same laws may later be projected to TLA+, Agda, Lean, Prolog, Haskell types or another verification backend.

Example law:

```text
forall b in SemanticAtomicBehaviorType:
  execute(b) in Ok union Error
```

Another law restricts normalization:

```text
caller(normalize) in { validate, self-healing }
```
