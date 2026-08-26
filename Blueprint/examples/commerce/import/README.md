# Initial master-data import

The v1 importer onboards `product`, `customer` and `supplier` master data from CSV or JSON without bypassing semantic validation.

## Input

JSON input is an array of objects. CSV input uses a header row and supports quoted commas, escaped quotes, BOM and CRLF. Parsing only converts the transport format into rows; it does not establish domain validity.

Each row is passed to a `SemanticMasterDataValidator`, which returns exactly one of:

- `Ok`: canonical identity plus the normalized semantic value;
- `Error`: actionable evidence (`code`, `message`, optional fields).

Persistence only receives `Ok` values.

## Dry run

Set `dry_run: true` to parse, validate, resolve canonical identities, calculate fingerprints and report conflicts without writing records, fingerprints or migration metadata.

## Duplicate and idempotency semantics

A semantic fingerprint is SHA-256 over the canonical entity, schema version, canonical key and normalized value.

- the same fingerprint already imported => `duplicate`; safe idempotent skip;
- the same canonical identity appearing twice in one source => `DUPLICATE_IN_SOURCE`;
- an existing canonical identity with different semantic data => `DUPLICATE_NATURAL_KEY`; never overwrite silently;
- an existing `migration_id` with different source content => `MigrationIdConflict`.

This distinction prevents "retry" from becoming an accidental update operation.

## Partial failure and transactions

Every valid row has its own transaction boundary:

1. persist normalized record;
2. persist its fingerprint in the same transaction;
3. commit.

If a row fails, that row is rolled back and reported as `PERSISTENCE_ERROR`; later independent rows continue. Invalid semantic rows never open a persistence transaction.

A retry of the same source skips rows whose fingerprint was committed and can retry rows that previously failed.

## Migration metadata

A non-dry-run import records `migration_id`, `schema_version`, entity, source digest, timestamp and row counters. A migration identifier is therefore tied to one immutable input payload.

Provider/database-specific adapters implement `ImportStore`; the importer itself has no database-specific dependency.