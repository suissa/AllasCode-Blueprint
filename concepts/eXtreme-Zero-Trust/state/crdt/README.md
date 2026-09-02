# CRDT state

The base entity projection is a deterministic revisioned register suitable when the relational write model + CDC supplies an authoritative monotonically increasing revision.

Merge order:

1. larger revision wins;
2. equal revision: larger writer rank wins;
3. exact tie: preserve local value.

This is intentionally narrower than claiming arbitrary multi-writer CRDT semantics.
