# Producer target

The producer obtains/receives an authenticated session capability, constructs an intent event, asks its sidecar to bind and sign the event, and publishes only the released envelope. It must never receive raw private key material.
