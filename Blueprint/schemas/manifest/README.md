# Manifest Schemas

## AtomicBehavior manifest

`atomicbehavior.schema.json` defines the canonical schema for the full Blueprint AtomicBehavior manifest shape used by `Blueprint/manifest.yml` and the starter template.

The schema requires `semantic.canonical_scenario` alongside the canonical behavior description. The function description answers what the Action does; the canonical scenario states when the intent classifier should select it. Neither field is a catalog of invalid scenarios.

Run validation from the repository root:

```sh
python -m pip install "PyYAML==6.0.2" "jsonschema==4.25.1"
python scripts/validate_atomicbehavior_manifest.py
python -m unittest discover -s tests -p 'test_atomicbehavior_manifest.py' -v
```

The validator checks the root example and starter template. Action-specific manifests under `Blueprint/atomicbehavior/actions/` currently use a distinct, more compact contract format and are not silently coerced into this schema; they require their own migration/validation policy before this schema is applied to them.
