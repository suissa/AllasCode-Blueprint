use allascode_extreme_zero_trust_sidecar::pipeline::{Accepted, Incoming, LinearMessage};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let incoming = LinearMessage::<Incoming>::new("demo-1", br#"{\"demo\":true}"#.to_vec());
    let accepted: LinearMessage<Accepted> = incoming.verify_for_demo()?;
    println!("LEDSA sidecar accepted {} bytes for {}", accepted.payload().len(), accepted.message_id());
    Ok(())
}
