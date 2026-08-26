import { ActorSystem } from './actor-system.js';
import { AgentRuntime } from './agent-runtime.js';
import { ToolRegistry } from './tool-registry.js';
import { ActionRegistry } from './action-registry.js';
import { commerceRoot } from './bootstrap.js';
import { loadCompiledSemanticGraph, projectRuntimeFromGraph } from './runtime-graph.js';
import { assertSemanticGovernor, governSemanticGraph } from './semantic-governor.js';

export async function createExecutionKernel() {
  const graph = await loadCompiledSemanticGraph(commerceRoot);
  assertSemanticGovernor(graph);
  const governance = governSemanticGraph(graph);
  const projection = await projectRuntimeFromGraph(commerceRoot, graph);

  const actions = new ActionRegistry();
  for (const definition of projection.actions) actions.register(definition.agent, definition.manifest, definition.implementation);

  const tools = new ToolRegistry();
  for (const definition of projection.tools) tools.register(definition.name, definition.ok, definition.error, definition.implementation);

  const actors = new ActorSystem(actions);
  for (const definition of projection.actors) actors.register(definition);

  const agents = new AgentRuntime(actors, tools);
  for (const definition of projection.agents) agents.register(definition);

  return { graph, governance, projection, actions, tools, actors, agents };
}
