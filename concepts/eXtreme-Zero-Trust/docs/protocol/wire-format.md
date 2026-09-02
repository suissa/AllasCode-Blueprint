# Wire format work item

The semantic field registry currently uses compact integer keys under `core/message/src/schema.ts`.

Before AON-ATCP interoperability is claimed, this document must contain:

1. deterministic CBOR encoding rules;
2. exact signature preimage definition;
3. maximum field sizes;
4. unknown-field behavior;
5. version negotiation;
6. complete hexadecimal test vectors;
7. negative vectors for malformed/non-canonical encodings.

No byte-level format is called "locked" until those vectors pass in at least two independent implementations.
