use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentEvent<T> {
    pub message_id: String,
    pub intent: String,
    pub audience: String,
    pub payload: T,
}

pub trait ExtremeZeroTrustClient {
    type Error;
    fn publish<T: Serialize>(&self, event: &IntentEvent<T>) -> Result<(), Self::Error>;
}
