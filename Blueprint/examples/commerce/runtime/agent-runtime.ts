import type { ActionContext, ActionResult } from './types.js';
import { ActorSystem } from './actor-system.js';
import { ToolRegistry } from './tool-registry.js';

export interface AgentDefinition {
  name: string;
  actor: string;
  actions: readonly string[];
  tools: readonly string[];
}

export class AgentRuntime {
  private readonly agents = new Map<string, AgentDefinition>();

  constructor(private readonly actors: ActorSystem, private readonly tools: ToolRegistry) {}

  register(definition: AgentDefinition): void {
    this.agents.set(definition.name, definition);
  }

  async execute(agentName: string, action: string, context: ActionContext): Promise<ActionResult> {
    const agent = this.agents.get(agentName);
    if (!agent) return { status: 'Error', event: 'AgentNotFound', payload: { message: `Agent not registered: ${agentName}` } };
    if (!agent.actions.includes(action)) return { status: 'Error', event: 'AgentActionDenied', payload: { message: `${agentName} cannot execute ${action}` } };
    return this.actors.send(agent.actor, action, context);
  }

  async useTool(agentName: string, toolName: string, input: unknown): Promise<ActionResult> {
    const agent = this.agents.get(agentName);
    if (!agent) return { status: 'Error', event: 'AgentNotFound', payload: { message: `Agent not registered: ${agentName}` } };
    if (!agent.tools.includes(toolName)) return { status: 'Error', event: 'AgentToolDenied', payload: { message: `${agentName} cannot use ${toolName}` } };
    return this.tools.execute(toolName, input);
  }
}
