#!/usr/bin/env python3
"""Executable PoC for CodeManager causal-healing evaluation.

No third-party dependencies are required. The runner can:
- hide gold fields before invoking a provider;
- invoke an external LLM/agent process over JSON stdin/stdout;
- replay gold outputs for scorer smoke tests;
- score causal-thesis quality by dimension;
- emit per-case and aggregate JSON reports.

The external command provider receives one JSON object on stdin:
{
  "task": "codemanager_causal_thesis",
  "record_id": "...",
  "observable_input": {...},
  "contract": {...}
}

It must print one JSON object matching the CodeManager output contract.
"""

from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence

ROOT = Path(__file__).resolve().parent
DEFAULT_EVAL = ROOT / "eval.jsonl"

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "if", "in",
    "into", "is", "it", "of", "on", "or", "that", "the", "this", "to", "with",
    "must", "only", "should", "then", "than", "not", "no", "without", "while",
}

CODEMANAGER_CONTRACT: Dict[str, Any] = {
    "fault_class": "code | system | unknown",
    "suspected_scope": "Action/implementation.zig | configs/core.yml | undetermined",
    "thesis": "single falsifiable causal claim",
    "mechanism": "mechanism connecting evidence to failure",
    "causal_chain": ["ordered causal steps"],
    "evidence_for": ["specific observations from input"],
    "evidence_against_or_missing": ["missing or contradictory evidence"],
    "alternative_causes": ["plausible alternatives"],
    "falsification_criteria": ["observable refutation criteria"],
    "predicted_intervention_effect": "observable change expected if thesis is correct",
    "solution_request": "bounded request to CodeHealerAgent, SystemHealerAgent, or diagnostics",
}

REQUIRED_OUTPUT = {
    "fault_class",
    "suspected_scope",
    "thesis",
    "mechanism",
    "causal_chain",
    "falsification_criteria",
    "alternative_causes",
    "solution_request",
}


def load_jsonl(path: Path) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, raw in enumerate(handle, 1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                records.append(json.loads(raw))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSON: {exc}") from exc
    return records


def public_record(record: Mapping[str, Any]) -> Dict[str, Any]:
    """Return exactly the information CodeManager is allowed to see."""
    return {
        "id": record["id"],
        "split": record.get("split", "eval"),
        "observable_input": record["observable_input"],
    }


def tokenize(value: Any) -> List[str]:
    text = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value
    tokens = re.findall(r"[a-z0-9_./+-]+", text.lower())
    return [t for t in tokens if len(t) > 1 and t not in STOPWORDS]


def token_f1(pred: Any, gold: Any) -> float:
    p = Counter(tokenize(pred))
    g = Counter(tokenize(gold))
    if not p and not g:
        return 1.0
    if not p or not g:
        return 0.0
    overlap = sum((p & g).values())
    precision = overlap / sum(p.values())
    recall = overlap / sum(g.values())
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def contains_any(text: str, needles: Sequence[str]) -> bool:
    lower = text.lower()
    return any(n.lower() in lower for n in needles)


def scope_compliance(pred: Mapping[str, Any], gold: Mapping[str, Any]) -> float:
    fault_class = pred.get("fault_class")
    scope = str(pred.get("suspected_scope", ""))
    request = str(pred.get("solution_request", ""))
    combined = f"{scope} {request}".lower()

    if fault_class == "code":
        good = "implementation.zig" in combined
        forbidden = "core.yml" in combined and "do not" not in combined
        return 1.0 if good and not forbidden else 0.0
    if fault_class == "system":
        good = "core.yml" in combined or "systemhealer" in combined
        forbidden = "implementation.zig" in combined and "do not" not in combined
        return 1.0 if good and not forbidden else 0.0
    if fault_class == "unknown":
        mutation_words = ["modify only", "patch implementation", "change core.yml", "write implementation"]
        return 0.0 if contains_any(combined, mutation_words) else 1.0
    return 0.0


def grounding_score(pred: Mapping[str, Any], record: Mapping[str, Any]) -> float:
    evidence = pred.get("evidence_for", [])
    if not evidence:
        # Legacy/gold records predate explicit evidence_for. Ground thesis+mechanism instead.
        evidence = [pred.get("thesis", ""), pred.get("mechanism", "")]
    source_tokens = set(tokenize(record["observable_input"]))
    cited = tokenize(evidence)
    if not cited:
        return 0.0
    grounded = sum(1 for token in cited if token in source_tokens)
    return min(1.0, grounded / max(1, len(cited)))


def validate_prediction(pred: Mapping[str, Any]) -> List[str]:
    errors: List[str] = []
    missing = sorted(REQUIRED_OUTPUT - set(pred.keys()))
    if missing:
        errors.append("missing fields: " + ", ".join(missing))
    if pred.get("fault_class") not in {"code", "system", "unknown"}:
        errors.append("fault_class must be code, system, or unknown")
    for key in ("causal_chain", "falsification_criteria", "alternative_causes"):
        if key in pred and not isinstance(pred[key], list):
            errors.append(f"{key} must be an array")
    return errors


def score_prediction(pred: Mapping[str, Any], record: Mapping[str, Any]) -> Dict[str, float]:
    gold = record["gold_codemanager"]
    dimensions = {
        "fault_class": 1.0 if pred.get("fault_class") == gold.get("fault_class") else 0.0,
        "fault_localization": token_f1(pred.get("suspected_scope", ""), gold.get("suspected_scope", "")),
        "evidence_grounding": grounding_score(pred, record),
        "causal_chain_quality": (
            0.35 * token_f1(pred.get("thesis", ""), gold.get("thesis", ""))
            + 0.35 * token_f1(pred.get("mechanism", ""), gold.get("mechanism", ""))
            + 0.30 * token_f1(pred.get("causal_chain", []), gold.get("causal_chain", []))
        ),
        "falsifiability": token_f1(pred.get("falsification_criteria", []), gold.get("falsification_criteria", [])),
        "solution_request_quality": token_f1(pred.get("solution_request", ""), gold.get("solution_request", "")),
        "mutation_scope_compliance": scope_compliance(pred, gold),
        "uncertainty_calibration": 1.0 if (
            (gold.get("fault_class") == "unknown") == (pred.get("fault_class") == "unknown")
        ) else 0.0,
    }
    weights = {
        "fault_class": 0.15,
        "fault_localization": 0.15,
        "evidence_grounding": 0.10,
        "causal_chain_quality": 0.20,
        "falsifiability": 0.15,
        "solution_request_quality": 0.10,
        "mutation_scope_compliance": 0.10,
        "uncertainty_calibration": 0.05,
    }
    dimensions["overall"] = sum(dimensions[name] * weight for name, weight in weights.items())
    return {k: round(v, 4) for k, v in dimensions.items()}


class Provider:
    def infer(self, record: Mapping[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class GoldReplayProvider(Provider):
    """Scorer smoke-test only. Never use its score as model quality."""

    def infer(self, record: Mapping[str, Any]) -> Dict[str, Any]:
        gold = dict(record["gold_codemanager"])
        gold.setdefault("evidence_for", [])
        gold.setdefault("evidence_against_or_missing", [])
        gold.setdefault("predicted_intervention_effect", record.get("gold_solution", {}).get("predicted_effect", ""))
        return gold


class CommandProvider(Provider):
    def __init__(self, command: str, timeout_seconds: int = 120):
        self.argv = shlex.split(command)
        if not self.argv:
            raise ValueError("--command cannot be empty")
        self.timeout_seconds = timeout_seconds

    def infer(self, record: Mapping[str, Any]) -> Dict[str, Any]:
        payload = {
            "task": "codemanager_causal_thesis",
            "record_id": record["id"],
            "observable_input": record["observable_input"],
            "contract": CODEMANAGER_CONTRACT,
            "rules": [
                "Use only observable_input; gold fields are unavailable.",
                "Infer a falsifiable causal thesis before requesting any mutation.",
                "For code faults authorize only the suspected Action implementation.zig.",
                "For system faults authorize only healable configs/core.yml via SystemHealerAgent.",
                "If evidence cannot distinguish code/system cause, return unknown and request diagnostics.",
                "Return JSON only.",
            ],
        }
        proc = subprocess.run(
            self.argv,
            input=json.dumps(payload, ensure_ascii=False),
            text=True,
            capture_output=True,
            timeout=self.timeout_seconds,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(f"provider exited {proc.returncode}: {proc.stderr.strip()}")
        output = proc.stdout.strip()
        try:
            return json.loads(output)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"provider returned invalid JSON: {output[:500]}") from exc


def aggregate(case_reports: Sequence[Mapping[str, Any]]) -> Dict[str, float]:
    if not case_reports:
        return {}
    names = list(case_reports[0]["scores"].keys())
    return {
        name: round(sum(float(case["scores"][name]) for case in case_reports) / len(case_reports), 4)
        for name in names
    }


def run(records: Sequence[Dict[str, Any]], provider: Provider) -> Dict[str, Any]:
    cases: List[Dict[str, Any]] = []
    for record in records:
        # Provider receives the in-memory record in this implementation, but CommandProvider
        # serializes only public fields. GoldReplayProvider is an explicit scorer-only exception.
        pred = provider.infer(record)
        validation_errors = validate_prediction(pred)
        scores = score_prediction(pred, record) if not validation_errors else {
            "fault_class": 0.0,
            "fault_localization": 0.0,
            "evidence_grounding": 0.0,
            "causal_chain_quality": 0.0,
            "falsifiability": 0.0,
            "solution_request_quality": 0.0,
            "mutation_scope_compliance": 0.0,
            "uncertainty_calibration": 0.0,
            "overall": 0.0,
        }
        cases.append({
            "id": record["id"],
            "public_input": public_record(record),
            "prediction": pred,
            "validation_errors": validation_errors,
            "scores": scores,
        })
    return {
        "schema_version": "1.0",
        "cases": cases,
        "aggregate": aggregate(cases),
    }


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate CodeManager causal-healing theses")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_EVAL)
    parser.add_argument("--provider", choices=("gold", "command"), default="gold")
    parser.add_argument("--command", help="external JSON stdin/stdout provider command")
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--output", type=Path, help="write report JSON to this path")
    parser.add_argument("--min-score", type=float, default=None, help="exit 2 if aggregate overall is lower")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    records = load_jsonl(args.dataset)
    if args.provider == "gold":
        provider: Provider = GoldReplayProvider()
    else:
        if not args.command:
            raise SystemExit("--provider command requires --command")
        provider = CommandProvider(args.command, args.timeout)

    report = run(records, provider)
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)

    if args.min_score is not None and report["aggregate"].get("overall", 0.0) < args.min_score:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
