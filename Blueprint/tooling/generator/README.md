# Semantic RFC Generator

This directory documents the generator implemented at [`scripts/generate-semantic-rfcs.py`](../../../scripts/generate-semantic-rfcs.py).

The generator produces the semantic RFC collection, canonical filenames, descriptors, the RFC index, and explicit semantic-scope metadata.

Run it with:

```bash
python scripts/generate-semantic-rfcs.py
```

Use `--check` in CI to fail when committed RFCs drift from the generator or when orphaned Markdown files remain:

```bash
python scripts/generate-semantic-rfcs.py --check
```
