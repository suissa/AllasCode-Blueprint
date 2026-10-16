import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "validate-v1-release-evidence.py"
SPEC = importlib.util.spec_from_file_location("release_evidence_validator", SCRIPT)
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class ReleaseEvidenceValidatorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.evidence_dir = self.root / "release" / "evidence" / "v1.0"
        self.evidence_dir.mkdir(parents=True)
        self.root_patch = patch.object(validator, "ROOT", self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.addCleanup(self.temp.cleanup)

    def test_missing_evidence_is_blocked(self):
        errors = validator.validate(self.evidence_dir / "staging-pilot.json", {"environment"})
        self.assertTrue(any("missing evidence file" in error for error in errors))

    def test_invalid_json_is_reported(self):
        path = self.evidence_dir / "staging-pilot.json"
        path.write_text("{broken", encoding="utf-8")
        errors = validator.validate(path, {"environment"})
        self.assertTrue(any("invalid JSON" in error for error in errors))

    def test_non_object_json_is_rejected(self):
        path = self.evidence_dir / "staging-pilot.json"
        path.write_text("[]", encoding="utf-8")
        errors = validator.validate(path, {"environment"})
        self.assertTrue(any("top-level JSON value must be an object" in error for error in errors))

    def test_missing_required_fields_are_reported(self):
        path = self.evidence_dir / "staging-pilot.json"
        path.write_text(json.dumps({"status": "passed"}), encoding="utf-8")
        errors = validator.validate(path, {"environment", "purchase_evidence"})
        self.assertTrue(any("missing fields: environment, purchase_evidence" in error for error in errors))

    def test_empty_evidence_value_is_rejected(self):
        path = self.evidence_dir / "staging-pilot.json"
        path.write_text(json.dumps({
            "status": "passed", "environment": "staging", "purchase_evidence": "",
            "evidence_owner": "operator", "evidence_uri": "https://example.test/evidence",
            "completed_at": "2026-10-16T10:00:00Z"
        }), encoding="utf-8")
        errors = validator.validate(path, {"environment", "purchase_evidence"})
        self.assertTrue(any("'purchase_evidence' must contain evidence" in error for error in errors))

    def test_complete_evidence_record_passes_structure_validation(self):
        path = self.evidence_dir / "staging-pilot.json"
        path.write_text(json.dumps({
            "status": "passed", "environment": "production-equivalent staging",
            "purchase_evidence": "record-1", "evidence_owner": "release-owner",
            "evidence_uri": "https://example.test/evidence",
            "completed_at": "2026-10-16T10:00:00Z"
        }), encoding="utf-8")
        errors = validator.validate(path, {"environment", "purchase_evidence"})
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
