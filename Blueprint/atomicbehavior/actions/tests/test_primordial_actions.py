from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

ACTIONS = (
    "CodeKnowledge.BuildObservationEnvelope",
    "CodeKnowledge.ResolveArtifact",
    "CodeKnowledge.ResolveSkill",
    "CodeKnowledge.CompileArtifactSkills",
    "CodeManager.CreateHealingHypothesis",
    "CodeHealer.StageCodeCandidate",
    "SystemHealer.StageConfigCandidate",
    "HealingVerifier.VerifyCandidate",
    "CodeKnowledge.PublishHealingCase",
    "HumanHealing.RequestContext",
)

REQUIRED = (
    "README.md",
    "manifest.yml",
    "config.yml",
    "schema/input.yml",
    "schema/output.yml",
    "schema/events.yml",
    "events/listen/request.yml",
    "events/emit/ok.yml",
    "events/emit/error.yml",
    "specifications/contract.yml",
    "specifications/scenarios.yml",
    "tests/contract.test.yml",
    "formalization/laws/core.law",
    "formalization/proofs/core.prov",
    "healing/pipeline.yml",
    "skills/authoring/SKILL.md",
    "skills/semantics/SKILL.md",
)


def read(action: str, relative: str) -> str:
    return (ROOT / action / relative).read_text(encoding="utf-8")


def required_fields(schema: str) -> set[str]:
    match = re.search(r"(?ms)^required:\n(?P<body>(?:  - .+\n)+)", schema)
    if not match:
        return set()
    return set(re.findall(r'^  - "([^"]+)"$', match.group("body"), re.M))


class PrimordialActionContracts(unittest.TestCase):
    def test_every_action_has_complete_specified_layout(self) -> None:
        for action in ACTIONS:
            with self.subTest(action=action):
                for relative in REQUIRED:
                    self.assertTrue((ROOT / action / relative).is_file(), relative)

    def test_canonical_identity_and_fixed_terminal_events(self) -> None:
        for action in ACTIONS:
            with self.subTest(action=action):
                manifest = read(action, "manifest.yml")
                events = read(action, "schema/events.yml")
                ok_event = read(action, "events/emit/ok.yml")
                error_event = read(action, "events/emit/error.yml")
                self.assertIn(f"canonical_label: {action}\n", manifest)
                self.assertIn(f"Ok: {action}.Ok", manifest)
                self.assertIn(f"Error: {action}.Error", manifest)
                self.assertIn(f"event: {action}.Ok", events)
                self.assertIn(f"event: {action}.Error", events)
                self.assertIn("configurable_result_events: false", events)
                self.assertIn(f"canonical_label: {action}.Ok", ok_event)
                self.assertIn("status: Ok", ok_event)
                self.assertIn(f"canonical_label: {action}.Error", error_event)
                self.assertIn("status: Error", error_event)

    def test_each_action_has_exactly_two_source_linked_skill_kinds(self) -> None:
        for action in ACTIONS:
            with self.subTest(action=action):
                authoring = read(action, "skills/authoring/SKILL.md")
                semantics = read(action, "skills/semantics/SKILL.md")
                self.assertIn(f"canonical_label: {action}", authoring)
                self.assertIn("skill_type: authoring", authoring)
                self.assertIn("source_manifest: ../../manifest.yml", authoring)
                self.assertIn(f"canonical_label: {action}", semantics)
                self.assertIn("skill_type: semantics", semantics)
                self.assertIn("source_manifest: ../../manifest.yml", semantics)
                self.assertEqual(1, len(re.findall(r"^skill_type: authoring$", authoring, re.M)))
                self.assertEqual(1, len(re.findall(r"^skill_type: semantics$", semantics, re.M)))

    def test_every_contract_declares_invariants_and_authority_boundary(self) -> None:
        for action in ACTIONS:
            with self.subTest(action=action):
                contract = read(action, "specifications/contract.yml")
                tests = read(action, "tests/contract.test.yml")
                proof = read(action, "formalization/proofs/core.prov")
                self.assertIn("invariants:", contract)
                self.assertRegex(contract, r"(?m)^  - id: INV-[A-Z]")
                self.assertIn("mutate_outside_declared_scope: true", tests)
                self.assertIn("mutation_applied: false", tests)
                self.assertIn("status: specified", proof)
                self.assertNotIn("status: proved", proof)

    def test_mutation_authorities_are_disjoint(self) -> None:
        code = read("CodeHealer.StageCodeCandidate", "manifest.yml")
        system = read("SystemHealer.StageConfigCandidate", "manifest.yml")
        verifier = read("HealingVerifier.VerifyCandidate", "manifest.yml")
        manager = read("CodeManager.CreateHealingHypothesis", "manifest.yml")

        self.assertIn('<target-action>/implementation/**', code)
        self.assertNotIn("configs/core.yml", code)
        self.assertIn("configs/core.yml#<authorized-healable-property>", system)
        self.assertNotIn("<target-action>/implementation/**", system)
        self.assertRegex(verifier, r"write_scope:\n\s+\[\]")
        self.assertRegex(manager, r"write_scope:\n\s+\[\]")

    def test_hypothesis_precedes_and_binds_every_candidate_mutation(self) -> None:
        hypothesis_output = read("CodeManager.CreateHealingHypothesis", "schema/output.yml")
        hypothesis_fields = required_fields(hypothesis_output)
        self.assertTrue({"hypothesis_hash", "observation_hash", "artifact_snapshot_hash", "created_at"} <= hypothesis_fields)

        for action in ("CodeHealer.StageCodeCandidate", "SystemHealer.StageConfigCandidate"):
            with self.subTest(action=action):
                input_schema = read(action, "schema/input.yml")
                output_schema = read(action, "schema/output.yml")
                contract = read(action, "specifications/contract.yml")
                self.assertTrue({"hypothesis", "hypothesis_hash", "observation_hash", "base_hash"} <= required_fields(input_schema))
                self.assertTrue({"hypothesis_hash", "observation_hash", "base_hash", "producer_actor_id", "producer_execution_id", "created_at"} <= required_fields(output_schema))
                self.assertIn("base_hash_matches_hypothesis_artifact_snapshot", contract)
                self.assertIn("hypothesis_created_before_candidate", contract)
                self.assertIn("candidate_hypothesis_hash_matches_hypothesis", contract)

    def test_coupled_faults_do_not_authorize_multi_dimension_mutation(self) -> None:
        manager = read("CodeManager.CreateHealingHypothesis", "specifications/contract.yml")
        self.assertIn("code, system, coupled, or unknown", manager)
        self.assertIn("never authorizes simultaneous code and configuration mutation", manager)
        self.assertIn("request simultaneous code and config mutation in one experiment", manager)

    def test_verifier_independence_is_machine_verifiable(self) -> None:
        input_schema = read("HealingVerifier.VerifyCandidate", "schema/input.yml")
        output_schema = read("HealingVerifier.VerifyCandidate", "schema/output.yml")
        contract = read("HealingVerifier.VerifyCandidate", "specifications/contract.yml")
        self.assertTrue({"hypothesis_hash", "candidate_hash", "producer_actor_id", "producer_execution_id", "verifier_actor_id", "verifier_execution_id"} <= required_fields(input_schema))
        self.assertTrue({"hypothesis_hash", "candidate_hash", "verifier_actor_id", "verifier_execution_id"} <= required_fields(output_schema))
        self.assertIn("producer_actor_id_differs_from_verifier_actor_id", contract)
        self.assertIn("producer_execution_id_differs_from_verifier_execution_id", contract)
        self.assertIn('"mutate the candidate"', contract)
        self.assertIn('"promote directly"', contract)

    def test_replay_eligibility_requires_bound_independent_verification(self) -> None:
        schema = read("CodeKnowledge.PublishHealingCase", "schema/input.yml")
        contract = read("CodeKnowledge.PublishHealingCase", "specifications/contract.yml")
        self.assertTrue({"hypothesis_hash", "candidate_hash", "verification_evidence_hash", "verifier_actor_id"} <= required_fields(schema))
        self.assertIn("verification_is_independent", contract)
        self.assertIn("verification_candidate_hash_matches_candidate", contract)
        self.assertIn("verification_hypothesis_hash_matches_hypothesis", contract)
        self.assertIn("only independently supported cases may be replay-eligible", contract)
        self.assertIn("falsified cases remain negative knowledge", contract)
        self.assertIn("inconclusive cases cannot authorize autonomous mutation", contract)

    def test_causal_chain_proofs_expose_open_runtime_obligations(self) -> None:
        for action in (
            "CodeManager.CreateHealingHypothesis",
            "CodeHealer.StageCodeCandidate",
            "SystemHealer.StageConfigCandidate",
            "HealingVerifier.VerifyCandidate",
            "CodeKnowledge.PublishHealingCase",
        ):
            with self.subTest(action=action):
                proof = read(action, "formalization/proofs/core.prov")
                self.assertIn("status: specified", proof)
                self.assertIn("specification_evidence:", proof)
                self.assertIn("open_obligations:", proof)
                self.assertNotIn("holes: 0", proof)
                self.assertNotIn("executable_evidence:", proof)

    def test_catalog_contains_each_action_once(self) -> None:
        catalog = (ROOT / "primordial-knowledge-and-healing-actions.yml").read_text(encoding="utf-8")
        for action in ACTIONS:
            with self.subTest(action=action):
                self.assertEqual(1, catalog.count(f"canonical_label: {action}\n"))


if __name__ == "__main__":
    unittest.main()
