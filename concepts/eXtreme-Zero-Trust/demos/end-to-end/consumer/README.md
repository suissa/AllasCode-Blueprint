# Consumer target

The consumer receives only messages released by its sidecar. For state-changing events it appends locally, applies the projection/CRDT and produces the receipt that authorizes the durable ACK.
