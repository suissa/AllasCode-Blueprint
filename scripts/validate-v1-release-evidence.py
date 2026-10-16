#!/usr/bin/env python3
"""Validate externally collected AllasCode v1.0 release acceptance evidence.

This gate intentionally rejects templates and self-asserted completion without
traceable evidence. It validates the evidence package; it does not perform a
real-business pilot or operator session.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "staging-pilot.json": {
        "environment",
        "purchase_evidence",
        "sale_evidence",
        "whatsapp_evidence",
        "ui_evidence",
        "backup_restore_evidence",
        "restart_evidence",
        "defect_triage",
    },
    "operator-acceptance.json": {
        "operator_role",
        "session_date",
        "product_stock_customer_supplier",
        "purchase_workflow",
        "sale_resolution",
        "error_recovery",
        "developer_assistance",
        "blocking_defects",
    },
}


def nonempty(value: Any) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return bool(value) and all(nonempty(item) for item in value)
    if isinstance(value, dict):
        return bool(value) and all(nonempty(item) for item in value.values())
    return value is not None and value is not False


def validate(path: Path, required: set[str]) -> list[str]:
    if not path.is_file():
        return [f"{path.relative_to(ROOT)}: missing evidence file"]
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"{path.relative_to(ROOT)}: invalid JSON ({exc})"]
    errors: list[str] = []
    if not isinstance(data, dict):
        return [f"{path.relative_to(ROOT)}: top-level JSON value must be an object"]
    if data.get("status") != "passed":
        errors.append(f"{path.relative_to(ROOT)}: status must be 'passed'")
    missing = sorted(required - data.keys())
    if missing:
        errors.append(f"{path.relative_to(ROOT)}: missing fields: {', '.join(missing)}")
    for key in sorted(required & data.keys()):
        if not nonempty(data[key]):
            errors.append(f"{path.relative_to(ROOT)}: '{key}' must contain evidence")
    if not nonempty(data.get("evidence_owner")):
        errors.append(f"{path.relative_to(ROOT)}: evidence_owner is required")
    if not nonempty(data.get("evidence_uri")):
        errors.append(f"{path.relative_to(ROOT)}: evidence_uri must link to a traceable record")
    if not nonempty(data.get("completed_at")):
        errors.append(f"{path.relative_to(ROOT)}: completed_at is required (ISO 8601)")
    return errors


def main() -> int:
    evidence_dir = ROOT / "release" / "evidence" / "v1.0"
    errors: list[str] = []
    for filename, fields in REQUIRED.items():
        errors.extend(validate(evidence_dir / filename, fields))
    if errors:
        print("v1.0 release evidence gate: BLOCK")
        for error in errors:
            print(f"- {error}")
        return 1
    print("v1.0 release evidence gate: PASS")
    print("Both pilot and operator evidence packages are present and structurally complete.")
    print("Human review of the linked evidence is still required before tagging v1.0.0.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
