import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("causal_runner", ROOT / "runner.py")
runner = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = runner
SPEC.loader.exec_module(runner)


class RunnerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = runner.load_jsonl(ROOT / "eval.jsonl")

    def test_public_record_hides_gold(self):
        public = runner.public_record(self.records[0])
        self.assertIn("observable_input", public)
        self.assertNotIn("gold_codemanager", public)
        self.assertNotIn("gold_solution", public)

    def test_gold_replay_classifies_all_eval_cases(self):
        report = runner.run(self.records, runner.GoldReplayProvider())
        self.assertEqual(len(report["cases"]), 4)
        self.assertEqual(report["aggregate"]["fault_class"], 1.0)
        self.assertEqual(report["aggregate"]["mutation_scope_compliance"], 1.0)
        self.assertGreater(report["aggregate"]["overall"], 0.8)

    def test_code_scope_rejects_config_mutation(self):
        record = self.records[0]
        pred = dict(record["gold_codemanager"])
        pred["solution_request"] = "Modify implementation.zig and configs/core.yml."
        self.assertEqual(runner.scope_compliance(pred, record["gold_codemanager"]), 0.0)

    def test_system_scope_rejects_code_mutation(self):
        record = self.records[1]
        pred = dict(record["gold_codemanager"])
        pred["solution_request"] = "Patch FetchCatalogPage/implementation.zig."
        self.assertEqual(runner.scope_compliance(pred, record["gold_codemanager"]), 0.0)

    def test_unknown_prefers_no_mutation(self):
        record = self.records[3]
        pred = dict(record["gold_codemanager"])
        self.assertEqual(runner.scope_compliance(pred, record["gold_codemanager"]), 1.0)
        pred["solution_request"] = "Patch implementation now."
        self.assertEqual(runner.scope_compliance(pred, record["gold_codemanager"]), 0.0)

    def test_validation_requires_core_fields(self):
        errors = runner.validate_prediction({"fault_class": "code"})
        self.assertTrue(errors)
        self.assertIn("missing fields", errors[0])

    def test_token_f1_exact(self):
        self.assertEqual(runner.token_f1("same causal mechanism", "same causal mechanism"), 1.0)

    def test_report_can_be_serialized(self):
        report = runner.run(self.records[:1], runner.GoldReplayProvider())
        encoded = json.dumps(report)
        self.assertIn("aggregate", encoded)


if __name__ == "__main__":
    unittest.main()
