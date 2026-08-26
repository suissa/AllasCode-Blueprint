import type { ActionContext, ActionResult } from './types.js';
import { ActionRegistry } from './action-registry.js';

export interface ActorDefinition {
  name: string;
  agent: string;
  actions: readonly string[];
  mailboxCapacity: number;
}

interface ActorState {
  definition: ActorDefinition;
  pending: number;
  tail: Promise<void>;
}

export class ActorSystem {
  private readonly actors = new Map<string, ActorState>();

  constructor(private readonly actions: ActionRegistry) {}

  register(definition: ActorDefinition): void {
    this.actors.set(definition.name, { definition, pending: 0, tail: Promise.resolve() });
  }

  async send(actorName: string, action: string, context: ActionContext): Promise<ActionResult> {
    const actor = this.actors.get(actorName);
    if (!actor) return { status: 'Error', event: 'ActorNotFound', payload: { message: `Actor not registered: ${actorName}` } };
    if (!actor.definition.actions.includes(action)) return { status: 'Error', event: 'ActorActionDenied', payload: { message: `${actorName} cannot execute ${action}` } };
    if (actor.pending >= actor.definition.mailboxCapacity) return { status: 'Error', event: 'ActorMailboxFull', payload: { message: `${actorName} mailbox is full` } };

    actor.pending += 1;
    const previous = actor.tail;
    let release!: () => void;
    actor.tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await this.actions.execute(`${actor.definition.agent}.${action}`, context);
    } finally {
      actor.pending -= 1;
      release();
    }
  }
}
