import gleam/result

pub type AgentState {
  AgentState(id: String, revision: Int)
}

pub type ReleasedMessage {
  ReleasedMessage(entity_id: String, revision: Int, payload: String)
}

pub fn apply(state: AgentState, message: ReleasedMessage) -> Result(AgentState, String) {
  case state, message {
    AgentState(id, current), ReleasedMessage(entity_id, revision, _) if id == entity_id && revision >= current ->
      Ok(AgentState(id, revision))
    _, _ -> Error("invalid semantic transition")
  }
}
