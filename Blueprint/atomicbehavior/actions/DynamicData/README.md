# Dynamic Data Processing Actions

This is the normative AtomicAction basis for processing data without prior
knowledge of its schema, field names, types or semantic meaning. It is not an
examples directory.

The basis is intentionally composable: a pivot is ProjectFields + GroupRecords
+ AggregateRecords; a local correlation or report view is an Agent orchestration
over these Actions rather than an opaque tool call. It allows a UIAgent to work
locally with synchronized browser data without sending a purely analytical
crossing back to the server.

## Families

- Observation: InspectValueShape, InferSchema, ProfileDataset, ResolveFieldPath,
  ClassifyFieldSemantics.
- Transformation: NormalizeValue, CoerceValue, ProjectFields, FilterRecords,
  MapRecords.
- Relational composition: GroupRecords, AggregateRecords, SortRecords,
  DeduplicateRecords, JoinDatasets, UnionDatasets, PartitionDataset.
- Assurance: EvaluateConstraint and RedactFields.
- Durable local outcome: MaterializeProjection.

Every Action has an independently invocable manifest; the detailed shared
contract, micro-skill, invariants, healing evidence and acceptance obligations
are in ACTIONS.yml. The Runtime, not an Action, emits the owning Behavior fixed
Ok/Error terminal events.
