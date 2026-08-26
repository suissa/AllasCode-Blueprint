# Semantic Testing Standard

Every independently identifiable AllasCode artifact MUST expose a `tests/` directory. The standard test types are `unit`, `bdd`, `load`, `stress`, `synk`, `security`, `integration`, `e2e`, and `benchmark`.

Actions are intentionally exempt from `bdd` and `e2e`; those two test types validate behavior/composition at a higher semantic scope. Every other artifact may declare all nine types.

Each test-type directory contains `README.md`, `manifest.yml`, `config.yml`, `implementation/`, `index.html`, `schema.jsin`, and `result.json`. `schema.jsin` is intentionally retained with the requested filename; its contents are valid JSON Schema and reference the canonical `result.schema.json`.

`result.json` is both evidence and presentation metadata. Metrics do not hard-code HTML. Each result declares which dashboard component type should represent one metric or a group of metrics.
