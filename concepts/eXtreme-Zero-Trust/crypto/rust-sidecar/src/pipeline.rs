use anyhow::{bail, Result};
use std::marker::PhantomData;

pub struct Incoming;
pub struct Accepted;
pub struct Persisted;
pub struct Ackable;

pub struct LinearMessage<State> {
    message_id: String,
    payload: Vec<u8>,
    _state: PhantomData<State>,
}

impl LinearMessage<Incoming> {
    pub fn new(message_id: impl Into<String>, payload: Vec<u8>) -> Self {
        Self { message_id: message_id.into(), payload, _state: PhantomData }
    }

    pub fn verify_for_demo(self) -> Result<LinearMessage<Accepted>> {
        if self.message_id.is_empty() { bail!("message id is required") }
        Ok(LinearMessage { message_id: self.message_id, payload: self.payload, _state: PhantomData })
    }
}

impl LinearMessage<Accepted> {
    pub fn mark_persisted(self) -> LinearMessage<Persisted> {
        LinearMessage { message_id: self.message_id, payload: self.payload, _state: PhantomData }
    }
}

impl LinearMessage<Persisted> {
    pub fn authorize_ack(self) -> LinearMessage<Ackable> {
        LinearMessage { message_id: self.message_id, payload: self.payload, _state: PhantomData }
    }
}

impl<S> LinearMessage<S> {
    pub fn message_id(&self) -> &str { &self.message_id }
    pub fn payload(&self) -> &[u8] { &self.payload }
}
