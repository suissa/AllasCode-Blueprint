use anyhow::Result;

/// Crypto-agility boundary. A production provider should implement a reviewed
/// hybrid classical + post-quantum key-establishment profile. This base module
/// intentionally does not pretend that a hash or mock secret is ML-KEM.
pub trait HybridKeyProvider {
    type Session;
    fn establish(&self, peer_identity: &[u8]) -> Result<Self::Session>;
}

#[derive(Debug, Clone)]
pub struct UnsupportedPqProvider;

impl HybridKeyProvider for UnsupportedPqProvider {
    type Session = ();
    fn establish(&self, _peer_identity: &[u8]) -> Result<Self::Session> {
        anyhow::bail!("install a reviewed ML-KEM/hybrid provider before production use")
    }
}
