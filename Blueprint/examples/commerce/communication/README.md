# Omnichannel Communication

This module generalizes the existing WhatsApp provider boundary into a provider-neutral communication layer.

## Providers

- WhatsApp: existing Evolution Go adapter remains the current implementation.
- Telegram: inbound webhook normalization and outbound text/media capability.
- Instagram: inbound messaging normalization and outbound capability when platform/account permissions allow it.
- Facebook Messenger: inbound webhook normalization, outbound messages/media and transport-level status capability.
- TikTok: capability-gated adapter. The current public developer surface must not be treated as a general outbound DM API; unsupported outbound operations return `UnsupportedCapability` rather than being simulated.

## Semantic boundary

Every provider message becomes the same normalized envelope:

`provider + account_id + conversation_id + sender_id + kind + idempotency_key + correlation_id + raw`

Provider message IDs become the idempotency boundary. Correlation IDs are stable and provider-qualified:

`{provider}:{account_id}:{provider_message_id}`

Transport delivery/read/failure information remains outside domain events. Provider authentication and webhook validation stay inside each adapter. The communication layer emits normalized channel messages; business intents are resolved later by the semantic runtime.

## Media

Text, image, audio, document and video are normalized at ingress. Provider-specific file/download semantics remain inside provider adapters so semantic extraction does not depend on Telegram/Meta/TikTok payload formats.
