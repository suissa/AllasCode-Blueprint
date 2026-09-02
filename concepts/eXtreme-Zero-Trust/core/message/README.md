# Message encoding

The canonical semantic envelope is independent from its wire representation.

The first interoperability target is deterministic CBOR; Protobuf MAY be offered as a generated projection if it preserves the same canonical fields and signature preimage rules.

Before signing, implementations MUST define a deterministic canonicalization procedure. Plain `JSON.stringify` is not a protocol-level canonical encoding.
