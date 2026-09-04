const std = @import("std");

pub const ActorState = struct {
    id: []const u8,
    revision: u64,
};

pub const ReleasedMessage = struct {
    entity_id: []const u8,
    revision: u64,
    payload_hash: []const u8,
};

pub const TransitionError = error{
    InvalidEntity,
    StaleRevision,
    EmptyPayloadHash,
};

pub fn apply(state: ActorState, message: ReleasedMessage) TransitionError!ActorState {
    if (!std.mem.eql(u8, state.id, message.entity_id)) return error.InvalidEntity;
    if (message.revision < state.revision) return error.StaleRevision;
    if (message.payload_hash.len == 0) return error.EmptyPayloadHash;

    return .{
        .id = state.id,
        .revision = message.revision,
    };
}
