#!/usr/bin/env python3
"""Validate the generated Semantic RFC collection."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
RFC_DIR = ROOT / "concepts" / "Semantics" / "RFCs"
GENERATOR = ROOT / "scripts" / "generate-semantic-rfcs.py"

def fail(message):
    errors.append(message)

errors = []
source = GENERATOR.read_text(encoding="utf-8")
match = re.search(r"TITLES = '''(.*?)'''\.strip", source, re.S)
if not match:
    fail("generator: TITLES catalog not found")
    sys.exit(1)

expected = {}
for line in match.group(1).strip().splitlines():
    ident, title = line.strip().split("|", 1)
    expected[ident] = title

def filename(ident, title):
    return f"{ident}-" + re.sub(r"[^A-Za-z0-9]+", "-", title).strip("-") + ".md"

actual = {p.name: p for p in RFC_DIR.glob("[0-9][0-9][0-9][0-9]-*.md")}
expected_names = {filename(i, t) for i, t in expected.items()}

for name in sorted(expected_names - set(actual)):
    fail(f"missing RFC file: {name}")
for name in sorted(set(actual) - expected_names):
    fail(f"orphan RFC file: {name}")

ids = sorted(map(int, expected))
if ids != list(range(55, 221)):
    fail("numbering: expected contiguous RFC-0055..RFC-0220")

labels = {}
for ident, title in expected.items():
    path = RFC_DIR / filename(ident, title)
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if not re.search(rf"^# RFC-{ident} — {re.escape(title)}$", text, re.M):
        fail(f"{ident}: title/header mismatch")
    subject = title.replace("Semantic Agent ", "").replace(" Specification", "")
    label = re.search(r'canonical_label: "([^"]+)"', text)
    wanted = re.sub(r"[^a-z0-9]+", ".", subject.lower()).strip(".")
    if not label or label.group(1) != wanted:
        fail(f"{ident}: canonical_label mismatch")
    if "## Escopo semântico" not in text:
        fail(f"{ident}: missing semantic scope")
    labels.setdefault(wanted, []).append(ident)

for label, ids_for_label in labels.items():
    if len(ids_for_label) > 1:
        fail(f"duplicate canonical_label {label}: {', '.join(ids_for_label)}")

index = (RFC_DIR / "INDEX.md").read_text(encoding="utf-8") if (RFC_DIR / "INDEX.md").exists() else ""
entries = re.findall(r"^- \[RFC-(\d{4}) — (.+?)\]\(([^)]+)\)$", index, re.M)
if len(entries) != len(expected):
    fail(f"INDEX.md: expected {len(expected)} entries, found {len(entries)}")
for ident, title, target in entries:
    if ident not in expected or expected[ident] != title:
        fail(f"INDEX.md: invalid entry RFC-{ident}")
    elif target != filename(ident, title):
        fail(f"INDEX.md: invalid target for RFC-{ident}")

if errors:
    print("Semantic RFC lint failed:")
    print("\n".join(f" - {e}" for e in errors))
    sys.exit(1)
print(f"Semantic RFC lint passed: {len(expected)} RFCs, contiguous numbering, unique labels, valid index.")
