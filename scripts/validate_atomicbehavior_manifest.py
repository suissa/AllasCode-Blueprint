#!/usr/bin/env python3
"""Validate the canonical AllasCode AtomicBehavior manifest and starter template."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "Blueprint/schemas/manifest/atomicbehavior.schema.json"
MANIFESTS = (
    ROOT / "Blueprint/manifest.yml",
    ROOT / "Blueprint/atomicbehavior/templates/manifest.yml",
)


def load_yaml(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as stream:
        return yaml.safe_load(stream)


def validate_manifest(path: Path, validator: Draft202012Validator) -> list[str]:
    relative = str(path.relative_to(ROOT))
    try:
        manifest = load_yaml(path)
    except (OSError, yaml.YAMLError) as exc:
        return [f"{relative}: YAML parse error: {exc}"]

    if not isinstance(manifest, dict):
        return [f"{relative}: manifest root must be a YAML mapping"]

    errors = [
        f"{relative}: {'.'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}"
        for error in validator.iter_errors(manifest)
    ]
    scenario = manifest.get("semantic", {}).get("canonical_scenario")
    if isinstance(scenario, str) and not scenario.strip():
        errors.append(f"{relative}: semantic.canonical_scenario must not be blank")

    if path.parent.name != "templates" and isinstance(scenario, str) and "REPLACE_WITH_" in scenario:
        errors.append(f"{relative}: canonical_scenario still contains a template placeholder")

    return errors


def main() -> int:
    try:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
    except Exception as exc:
        print(f"AtomicBehaviorManifestSchemaError: {exc}", file=sys.stderr)
        return 2

    validator = Draft202012Validator(schema)
    errors: list[str] = []
    for path in MANIFESTS:
        errors.extend(validate_manifest(path, validator))

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print("AtomicBehaviorManifestInvalid")
        return 1

    print("AtomicBehaviorManifestOk")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
