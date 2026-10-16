from __future__ import annotations

import json
import unittest
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, ValidationError


ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / "Blueprint/schemas/manifest/atomicbehavior.schema.json").read_text(encoding="utf-8"))
VALIDATOR = Draft202012Validator(SCHEMA)


class AtomicBehaviorManifestSchemaTests(unittest.TestCase):
    def test_blueprint_root_manifest_conforms_and_has_canonical_scenario(self) -> None:
        manifest = yaml.safe_load((ROOT / "Blueprint/manifest.yml").read_text(encoding="utf-8"))
        VALIDATOR.validate(manifest)
        self.assertTrue(manifest["semantic"]["canonical_scenario"].strip())

    def test_starter_template_conforms_and_exposes_canonical_scenario_field(self) -> None:
        manifest = yaml.safe_load((ROOT / "Blueprint/atomicbehavior/templates/manifest.yml").read_text(encoding="utf-8"))
        VALIDATOR.validate(manifest)
        self.assertIn("canonical_scenario", manifest["semantic"])
        self.assertTrue(manifest["semantic"]["canonical_scenario"].strip())

    def test_missing_canonical_scenario_is_rejected(self) -> None:
        manifest = yaml.safe_load((ROOT / "Blueprint/atomicbehavior/templates/manifest.yml").read_text(encoding="utf-8"))
        del manifest["semantic"]["canonical_scenario"]
        with self.assertRaises(ValidationError):
            VALIDATOR.validate(manifest)

    def test_blank_canonical_scenario_is_rejected(self) -> None:
        manifest = yaml.safe_load((ROOT / "Blueprint/atomicbehavior/templates/manifest.yml").read_text(encoding="utf-8"))
        manifest["semantic"]["canonical_scenario"] = "   "
        with self.assertRaises(ValidationError):
            VALIDATOR.validate(manifest)

    def test_required_manifest_sections_cannot_be_omitted(self) -> None:
        manifest = yaml.safe_load((ROOT / "Blueprint/atomicbehavior/templates/manifest.yml").read_text(encoding="utf-8"))
        del manifest["invocation"]
        with self.assertRaises(ValidationError):
            VALIDATOR.validate(manifest)


if __name__ == "__main__":
    unittest.main()
