# NATS development infrastructure

For local development use the official NATS image with JetStream enabled. Production deployment must configure persistent volumes, credentials, TLS, resource limits and an explicit retention policy; the demo compose file intentionally does not pretend to be production hardening.
