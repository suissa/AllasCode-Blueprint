# Koka effects plane

Domain code declares *what effect is required* rather than directly importing NATS, storage or console APIs. Handlers choose the runtime implementation.

The target effects are deliberately small and payload-oriented: crypto, network, state and intent.
