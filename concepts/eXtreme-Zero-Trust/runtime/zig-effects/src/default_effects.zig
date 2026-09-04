const std = @import("std");

pub const EffectKind = enum {
    crypto,
    network,
    state,
    intent,
};

pub const EffectRequest = struct {
    id: []const u8,
    kind: EffectKind,
    capability_id: []const u8,
    payload_hash: []const u8,
};

pub const EffectReceipt = struct {
    request_id: []const u8,
    settled_at_ms: u64,
    accepted: bool,
};

pub const RuntimeEffects = struct {
    pub fn authorizeIntent(intent: []const u8, payload_hash: []const u8) bool {
        return intent.len > 0 and payload_hash.len > 0;
    }

    pub fn settle(request: EffectRequest, now_ms: u64) EffectReceipt {
        return .{
            .request_id = request.id,
            .settled_at_ms = now_ms,
            .accepted = request.capability_id.len > 0 and request.payload_hash.len > 0,
        };
    }
};
