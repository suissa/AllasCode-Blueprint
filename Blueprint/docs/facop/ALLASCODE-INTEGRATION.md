# FACoP → AllasCode Integration

This directory contains the AllasCode implementation of the FullAgenticCollab integration contract.

The protocol is forge-independent. GitHub workflows are adapters over the same semantic profiles and MUST NOT become the authority for collaboration semantics.

## Canonical evidence subject

An AllasCode Action is the smallest independently qualified evidence subject. In the commerce reference implementation an Action keeps its existing Everything-as-Code anatomy:

```text
actions/<action>/
├── README.md
├── manifest.yml
├── config.yml
├── schema/
├── events/
├── specifications/
├── formalization/
├── healing/
├── implementation/
└── tests/action.test.ts
```

The identity is `manifest.yml#semantic_id`. Physical folder names are adapters and may change without becoming semantic identity.

## Compiler consequence

AllasCode already compiles a semantic graph and maps changed files into a semantic closure. FACoP extends that pipeline rather than introducing a second graph:

```text
Changed Artifact
  -> AllasCode Semantic Graph
  -> Semantic Closure
  -> FACoP Evidence Subjects
  -> EvidenceKey comparison
  -> Invalidated Evidence
  -> Required Executions
  -> Evidence Passport
```

`runtime/facop.ts` implements the evidence model. `scripts/facop-plan.ts` compiles an execution plan from the graph. `scripts/run-facop-qualification.ts` executes only invalidated Action evidence. `scripts/facop-qualify.ts` verifies closure and emits the passport.

## EvidenceKey

The key is SHA-256 over every stable Action artifact plus project-level semantic/runtime/validation inputs declared in `facop.yml` and the execution environment.

Generated `result.json`, dashboards and temporary evidence are intentionally excluded from the Action input hash: they are outputs of validation and cannot recursively invalidate their own predicate.

A key changes when any relevant source, schema, config, specification, formalization, Action test, semantic runtime, validation policy, profile compiler or execution environment changes.

## Validation ownership

Contributor-visible Action evidence:

- unit
- Action-registry integration characterization
- security misuse probes
- dependency/synk scan
- load
- stress
- chaos
- benchmark

Project-owned stage acceptance remains outside the Action folder:

- system integration
- E2E
- security hardening
- dependency audit

An Action therefore cannot make its own change acceptable by silently rewriting the upstream acceptance boundary.

## Chaos semantics

Every Action exposes the `chaos` category. An Action fixture MAY provide a meaningful failure-injection probe. When no external or stateful failure surface is declared, the executable result is `not-applicable` and MUST include a reason. The category never silently disappears.

## Profiles

`local` and `dev` are contributor trust profiles and select only semantically impacted Action evidence.

`stage` is upstream-controlled and runs project-owned unit/integration/E2E/security acceptance.

`qualification` checks every Action subject. A prior Evidence Passport is reusable only when the complete EvidenceKey matches. Invalid or missing keys cause re-execution.

`upstream` carries the qualified tree into review/merge governance and review observation.

GitHub branch suffixes such as `-dev`, `-stage` and `-tests` are one adapter mapping of those profiles, not part of FACoP itself.

## Evidence Passport

The passport records:

- exact commit and tree SHA;
- execution environment;
- stage acceptance evidence;
- every Action semantic identity;
- EvidenceKey;
- executed/reused decision;
- category statuses and metrics;
- explicit `not-applicable` reasons;
- qualification closure counts.

Qualification means **prove that valid evidence exists for every required predicate**, not blindly rerun every historical test.

## Standards composition

FACoP does not replace SLSA/in-toto provenance, CDEvents/CloudEvents, SARIF, SPDX/CycloneDX or OpenTelemetry. AllasCode can project passport/lifecycle data into those adapters while the core semantic protocol remains stable.

## Reference implementation

The executable reference lives in `Blueprint/examples/commerce`:

- `facop.yml` — Everything-as-Code FACoP policy;
- `runtime/facop.ts` — compiler/runtime model;
- `scripts/facop-plan.ts` — evidence planning;
- `scripts/run-facop-stage.ts` — upstream stage acceptance;
- `scripts/run-facop-qualification.ts` — selective expensive evidence execution;
- `scripts/facop-qualify.ts` — evidence closure and passport;
- `tests/facop-evidence.test.ts` — contract tests;
- `.github/workflows/commerce-facop-*.yml` — GitHub adapter profiles.
