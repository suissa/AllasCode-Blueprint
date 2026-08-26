import { ActorSystem } from './actor-system.js';
import { AgentRuntime } from './agent-runtime.js';
import { ToolRegistry } from './tool-registry.js';
import { ActionRegistry } from './action-registry.js';
import { commerceRoot } from './bootstrap.js';
import { loadSemanticArchitecture } from './semantic-loader.js';
import { assertSemanticArchitecture, validateSemanticArchitecture } from './semantic-validator.js';

export async function createExecutionKernel() {
  const definitions = await loadSemanticArchitecture(commerceRoot);
  const validation = await validateSemanticArchitecture(commerceRoot, definitions);
  assertSemanticArchitecture(validation);

  const actions = new ActionRegistry();
  for (const definition of definitions.actions) {
    actions.register(definition.ownerAgent, definition.manifest, definition.implementation);
  }

  const tools = new ToolRegistry();
  for (const definition of definitions.tools) {
    tools.register(definition.name, definition.ok, definition.error, definition.implementation);
  }

  const actors = new ActorSystem(actions);
  for (const definition of definitions.actors) {
    const owner = definitions.agents.find(agent => agent.actor === definition.name);
    if (!owner) throw new Error(`No Agent owns actor ${definition.name}`);
    actors.register({
      name: definition.name,
      agent: owner.name,
      actions: definition.actions,
      mailboxCapacity: definition.mailboxCapacity,
    });
  }

  const agents = new AgentRuntime(actors, tools);
  for (const definition of definitions.agents) {
    agents.register(definition);
  }

  return { actions, tools, actors, agents, definitions, validation };
}
