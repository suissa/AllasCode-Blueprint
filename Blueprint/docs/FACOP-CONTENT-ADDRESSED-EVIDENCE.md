# FACoP Content-Addressed Evidence in AllasCode

Status: executable specification v0.1.

## Boundary

AllasCode owns semantic identity, dependency closure, impact analysis, evidence requirements, and qualification. FACoP contributes the evidence lifecycle and trust model. GitHub/GitLab/Forgejo workflows are adapters and are not semantic inputs merely because of their forge representation.

The authoritative transformation is:

```text
Changed Artifact
  -> Semantic Seeds
  -> Predicate-Specific Closure
  -> Evidence Requirements
  -> execute | reuse | reject
  -> Verified Evidence
  -> Evidence Passport
```

## Stable identity

Action evidence uses `manifest.semantic_id`. Display names and folders are locators. Evidence is keyed per predicate, never once per Action:

```text
EvidenceKey = SHA-256(canonical({
  subject_id,
  predicate_id,
  predicate_version,
  semantic_inputs,
  execution_inputs,
  environment_class
}))
```

YAML/JSON values are parsed and canonically sorted before hashing. Comments, formatting, absolute paths, mtimes, and timestamps do not affect the key. Source files remain byte-addressed.

## Reuse

An identical key only establishes identical declared inputs. Reuse additionally requires:

- a passing or justified `not-applicable` result;
- verified attestation;
- producer trust for the consuming profile;
- profile authorization;
- compatible environment class;
- evidence that is neither expired nor revoked;
- complete dependency closure.

Failures are explicit reason codes in the EvidencePlan. Qualification fails closed when an input cannot be mapped.

## Graph extensions

The compiler emits `ValidationProfile`, `EvidencePredicate`, and `EvidenceRequirement` nodes. Subjects connect through `REQUIRES_EVIDENCE`; requirements connect to predicates through `EVALUATES`. Existing Test/TestResult/Metric nodes remain the raw execution projection.

System predicates traverse participating semantic relationships. Unit and characterization predicates remain subject-scoped unless configuration adds shared runtime inputs. Cycles must eventually be evaluated as strongly connected components; qualification must never depend on a fixed traversal depth.

## Profiles

The forge-neutral declaration is `examples/commerce/evidence/profiles.yml`:

- `local`: contributor, changed subjects;
- `dev`: contributor CI, changed and affected subjects;
- `stage`: upstream acceptance for unit/integration/E2E/security;
- `qualification`: complete evidence closure with verified reuse;
- `upstream`: proposal and review lifecycle.

Contributor-owned Action tests cannot be the sole integration/E2E/security acceptance authority.

## Runtime API

`runtime/content-addressed-evidence.ts` provides:

- `canonical`;
- `loadProfiles`;
- `compileRequirements`;
- `enrichEvidenceGraph`;
- `compileEvidencePlan`;
- `emitPassport`.

Generate an auditable plan:

```bash
npm run evidence:plan -- --profile=dev
npm run evidence:plan:qualification
```

Supply a previous Passport using `--previous=<path>`. Unattested or profile-incompatible evidence is rejected, not silently ignored.

## Migration

The current coarse provenance/freshness scripts remain temporarily available. The content-addressed planner runs beside them until mutation tests show equal or safer invalidation. Only then should the release gate stop reading legacy artifact/governance/graph hashes.

## Required invariants

1. A duplicate Action `semantic_id` fails compilation.
2. Relevant semantic or execution input changes alter the corresponding EvidenceKey.
3. Unrelated changes preserve unrelated predicate keys.
4. No evidence is reused solely because its key matches.
5. Every qualification requirement has exactly one admissible Evidence record.
6. `generated_at` never affects the stable Passport identity.
7. Forge adapters produce identical requirements and keys for identical semantic inputs.

## Initial implementation sequence

1. Stable semantic identities and Action source paths.
2. Evidence schemas and graph node types.
3. Versioned profile/predicate declarations.
4. Deterministic canonicalization and per-predicate keys.
5. Graph-native requirements.
6. Reuse admission and explicit EvidencePlan.
7. Result normalization and trusted attestations.
8. Complete closure verification and Passport generation.
9. Thin forge adapters.
10. Retirement of coarse freshness hashing after shadow validation.
