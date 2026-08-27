# Hyperpersonalized Marketing

This bounded context consumes customer, sale, interaction and inventory evidence and produces explainable `MarketingIntent` outputs. It does not mutate Customer, Sale, Purchase, Inventory or Financial state.

## Inputs

- customer consent events
- completed sales and product affinity
- customer interactions/contact history
- current offer/inventory candidates

## Outputs

- ranked personalized offers
- explanation/reason score breakdown
- channel-specific outbound `MarketingIntent`
- campaign outcome attribution

## Governance

No outreach is eligible without explicit consent for the requested channel. Suppression is stronger than consent. Frequency caps are evaluated before creating an outbound intent. Campaign/customer/channel is an idempotency boundary, so retries cannot create a second contact intent.

The initial scorer is deterministic and intentionally transparent. It combines product affinity, recency, purchase frequency, monetary value, stock availability and an optional base offer score. A future ML/recommendation model may implement the same scoring port, but it must preserve consent, suppression, explainability, frequency cap and idempotency invariants.

## WhatsApp

The module emits an intent only. Evolution Go remains a transport/provider and the WhatsApp conversation layer remains responsible for delivery and interaction orchestration.
