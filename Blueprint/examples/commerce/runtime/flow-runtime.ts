import { readFile } from 'node:fs/promises';
import type { CommerceState, ExecutionReport } from './types.js';
import { AgentRuntime } from './agent-runtime.js';
import { InMemoryEventBus } from './event-bus.js';

export class FlowRuntime {
  constructor(
    private readonly state: CommerceState,
    private readonly agents: AgentRuntime,
    readonly events: InMemoryEventBus,
  ) {}

  async execute(flowPath: string, initialPayload: unknown): Promise<ExecutionReport> {
    const source = await readFile(flowPath, 'utf8');
    const lines = source.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const intent = lines[0] ?? 'UnknownIntent';
    let payload = initialPayload;
    let lastEvent: string | undefined;

    for (const line of lines.slice(1)) {
      if (line.includes('.Error -> Error')) continue;

      if (line.startsWith('->>')) {
        const target = line.slice(3).trim();
        const separator = target.indexOf('.');
        if (separator <= 0 || separator === target.length - 1) {
          return {
            status: 'Error',
            intent,
            last_event: lastEvent,
            payload: { message: `Invalid action target: ${target}` },
          };
        }

        const agentName = target.slice(0, separator);
        const actionName = target.slice(separator + 1);
        const result = await this.agents.execute(agentName, actionName, { state: this.state, payload });
        this.events.emit(result.event, result.payload);
        lastEvent = result.event;
        payload = result.payload;
        if (result.status === 'Error') {
          return { status: 'Error', intent, last_event: lastEvent, payload };
        }
        continue;
      }

      if (line.startsWith('<-')) {
        const expected = line.slice(2).trim();
        if (lastEvent !== expected) {
          return {
            status: 'Error',
            intent,
            last_event: lastEvent,
            payload: { message: `Flow expected ${expected}, received ${lastEvent ?? 'nothing'}` },
          };
        }
        continue;
      }

      if (line.startsWith('->')) {
        const event = line.slice(2).trim();
        this.events.emit(event, payload);
        lastEvent = event;
      }
    }

    return { status: 'Ok', intent, last_event: lastEvent, payload };
  }
}
