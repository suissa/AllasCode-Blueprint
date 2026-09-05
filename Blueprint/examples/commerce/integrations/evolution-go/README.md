# Evolution Go WhatsApp Provider

This adapter integrates the commerce example with Evolution Go without allowing the provider to own domain behavior.

Evolution Go is treated as a transport/provider. Inbound events are validated and normalized, deduplicated by provider message ID, and translated into the transport-neutral Application API. Outbound messages use Evolution Go REST endpoints with the instance `apikey`.

## Supported inbound payloads

- text
- image metadata
- audio metadata
- document metadata
- delivery/read/failure status events

Media extraction/download remains a separate capability; this adapter preserves the complete provider message object so the media-ingestion layer can request the binary later.

## Security

Evolution Go documents webhook POST delivery but does not document a native webhook signature in the provider contract used here. Therefore this ingress requires an application-owned shared secret header. Deployments should additionally terminate TLS and restrict ingress at the reverse proxy/network layer.

## Idempotency

Provider retries are expected. The provider message ID is the idempotency key. The ingress records the ID before invoking the application boundary, so repeated webhook delivery cannot duplicate domain effects.

## Architectural boundary

`EvolutionGoWebhookIngress -> ApplicationApi -> Intent Runtime`

The adapter never addresses an Agent, Actor or Action directly.
