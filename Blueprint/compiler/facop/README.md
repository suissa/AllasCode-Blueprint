# FACoP Compiler Target

The FACoP compiler target projects the AllasCode semantic graph and Everything-as-Code declarations into collaboration evidence infrastructure.

It is not a second compiler and it does not own GitHub. It consumes the existing AllasCode graph and produces a portable FACoP plan.

## Input

- Action `manifest.yml`, `config.yml`, schemas, events, specifications, formalization, healing declarations, implementation and contributor-visible tests;
- project `config.yml` and `facop.yml`;
- compiled semantic graph;
- changed-file set;
- previous Evidence Passport when one exists;
- runtime/toolchain environment identity.

## IR projection

The FACoP projection can be understood as:

```text
SemanticGraph
+ ChangeSet
+ ValidationPolicy
+ PreviousPassport?
+ Environment
  -> EvidencePlan
```

`EvidencePlan` contains selected semantic subjects, current EvidenceKeys, execute/reuse decisions, required profile commands and semantic-impact metadata.

## Backends

A backend maps the stable plan to a forge/runtime:

- GitHub Actions;
- GitLab CI;
- Forgejo/Gitea Actions;
- local CLI;
- future AllasCode runtime adapters.

The GitHub example uses branch suffixes as adapter state only. FACoP state remains `local | dev | stage | qualification | upstream`.

## Invalidation law

For an evidence predicate `E` with complete ordered input closure `I(E)`:

```text
EvidenceKey(E) = SHA256(canonical(I(E)) + environment)

EvidenceKey_previous(E) == EvidenceKey_current(E)
  -> evidence MAY be reused

EvidenceKey_previous(E) != EvidenceKey_current(E)
  -> evidence MUST be invalidated
```

A missing, expired or revoked passport is equivalent to no reusable evidence.

## Qualification law

Qualification succeeds only when:

```text
required_evidence == executed_valid_evidence + reusable_valid_evidence
missing == 0
invalid == 0
stage_acceptance == passed
```

This target is implemented by the commerce reference runtime under `Blueprint/examples/commerce/runtime/facop.ts` and its scripts.
