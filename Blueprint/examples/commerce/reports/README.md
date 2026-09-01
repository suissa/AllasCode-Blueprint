# Reports

Conversational reporting module for the commerce example.

## Interaction model

The primary UI is a chat overlay. Report widgets are projection-backed and reveal behind the chat as the conversation advances. The visual plane is always dark/black and uses glassmorphism so the conversational layer remains readable while charts stay visible.

```text
ReportIntent
  -> ReportsManagerAgent
  -> ProjectionAgent
  -> ReportProjectionTool
  <- Ok | Error
  -> CompositionAgent
  -> WidgetCompositionTool
  <- Ok | Error
  -> ShareAgent
  -> UniqueShareLinkTool
  -> PreviewImageTool
  -> CommunicationIntentTool
  <- Ok | Error
<- Reports.Ok | Reports.Error
```

## Sharing

`ReportShareService` creates an opaque 192-bit random token. The token is not derived from report id, customer id, tenant id or predictable counters. Shares have TTL and can be revoked only by the owning context.

For WhatsApp the module prepares:

- a PNG preview URL through `ReportPreviewRendererPort`;
- a unique interactive report URL;
- a caption containing the report title and link.

The Communication context remains responsible for actual delivery.

## Visualization

The demo uses Apache ECharts plus ECharts-GL. The domain does not depend on ECharts. ECharts-GL provides WebGL-based 3D plots and the demo exercises 2D and 3D families.

Open `demo/index.html` from an HTTP server. The gallery includes line, area, bar, stacked bar, pie, donut, scatter, bubble, radar, gauge, funnel, heatmap, candlestick, treemap, sunburst, sankey, graph/network, parallel coordinates, boxplot, bar3D, scatter3D, line3D and surface3D examples.

## Invariants

- UI never recomputes financial totals from raw records.
- Every widget declares the backend projection that produced its data.
- Share tokens are opaque, expiring and revocable.
- Cross-module actions are emitted as Intents; Reports does not call another module ManagerAgent directly.
- WhatsApp preview generation is a Port, not hidden behavior inside the ManagerAgent.
