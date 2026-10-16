---
name: create-atomicbehavior-manifest
description: Author a complete AllasCode Blueprint AtomicBehavior manifest and its referenced contract artifacts using the repository's established structure.
version: 1.0.0
author: AllasCode
always: false
skill_type: authoring
---

# Create an AtomicBehavior Manifest

## Objective

Create a complete `manifest.yml` for one Blueprint AtomicBehavior. The manifest must connect canonical semantics, identity, invocation and authorization, schemas, events, implementation, and formalization artifacts using the repository's existing conventions.

## 1. Inspect before authoring

Read the root `Blueprint/manifest.yml`, the target category's examples, at least one complete Action directory under `Blueprint/atomicbehavior/actions/`, relevant shared schemas under `Blueprint/schemas/`, and existing validation workflows/scripts.

Treat existing Blueprint manifests and schemas as authoritative. Do not copy the minimal AllasCode core manifest format into a Blueprint AtomicBehavior or invent fields unsupported by the current repository.

## 2. Ask for canonical semantics

Unless already sufficiently established, ask the user in natural language:

1. **Canonical function:** What behavior or business functionality does this function provide?
2. **Canonical scenario:** In which situation should the intent classifier select this function?

Example explanation:

> This function creates one new user. Use it when the supplied phone number does not already exist in the database.

Represent these as semantic metadata in the manifest using the existing Blueprint conventions. Prefer an existing semantic description field for the canonical function and add a clearly named `canonical_scenario` only if no equivalent exists in the authoritative schema.

Do not infer the scenario from the function name. If the user intent conflicts with implementation, schemas, invariants, or tests, stop and report the conflict rather than choosing silently.

Do not require invalid scenarios, negative examples, or exhaustive non-selection rules. Canonical semantics are for identifying and classifying the Action; invalid inputs and execution failures belong in contracts, scenarios, and error handling where they are operationally necessary.

## 3. Required manifest responsibilities

Follow the exact field names and nesting used by the Blueprint schema and existing valid manifests. At minimum, ensure the manifest coherently declares:

- API version and `AtomicBehavior` kind;
- stable identity and version;
- semantic behavior type, entity/context when applicable, and canonical function/scenario meaning;
- purpose and bounded authority/capabilities where required;
- invocation mode, actor, authorization, request/response contract, and event names where applicable;
- references to input, output, error, and event schemas;
- references to contract specifications, scenarios, healing pipeline, laws, and proof evidence when applicable;
- implementation location and supported execution settings;
- the two contractual result categories, `Ok` and `Error`, according to the established Blueprint convention.

Not every Action has every artifact. Use the repository's requiredness rules; do not invent a law, proof, event, mutation, capability, or schema just to fill a template. If a referenced artifact is required, create it and ensure the path resolves.

## 4. Separate semantics, execution, and effects

Keep these concepts distinct:

- **Canonical function:** what business behavior the Action provides.
- **Canonical scenario:** when the classifier should select it.
- **Input/output contracts:** the types and constraints accepted or returned.
- **Result:** the Action's contractual `Ok` or `Error`.
- **Events and Data Plane effects:** facts or mutations that are actually declared and supported by the implementation contract.
- **Internal agent states:** implementation details, not additional contractual result categories.

Do not claim that a database mutation committed merely because the Action returned `Ok`. Describe persistence and event-publication guarantees only when the relevant contracts establish them.

## 5. Create consistent referenced artifacts

Use relative references consistent with nearby Action directories, such as `./schema/input.yml`, `./schema/output.yml`, `./schema/error.yml`, `./schema/events.yml`, and `./specifications/contract.yml`.

Create or update only artifacts required by the target Action. Ensure all manifest references resolve. Keep error details structured and safe; do not embed actual user payloads or other users' private traces in static manifests.

## 6. Validation

Run the validation available in the repository:

1. Parse every YAML file created or changed.
2. Validate the manifest against the authoritative manifest schema or project validator.
3. Resolve every relative artifact path.
4. Check event names, schema references, canonical identity, and result categories for consistency.
5. Run relevant contract tests and CI checks where possible.
6. Review the diff for unsupported fields, invented guarantees, unrelated changes, and accidental authority expansion.

Do not label a manifest as validated if checks were not executed. Clearly separate successful checks from checks that remain unavailable.

## Deliverables

Provide the complete manifest and all required referenced artifacts, plus validation evidence and unresolved discrepancies. A manifest with broken references or invented semantics is not complete.
