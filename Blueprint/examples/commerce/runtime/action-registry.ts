import type { ActionContext, ActionImplementation, ActionManifest, ActionResult } from './types.js';

interface RegisteredAction {
  manifest: ActionManifest;
  implementation: ActionImplementation;
}

export class ActionRegistry {
  private readonly actions = new Map<string, RegisteredAction>();

  register(agent: string, manifest: ActionManifest, implementation: ActionImplementation): void {
    this.actions.set(`${agent}.${manifest.name}`, { manifest, implementation });
  }

  async execute(key: string, context: ActionContext): Promise<ActionResult> {
    const registered = this.actions.get(key);
    if (!registered) {
      return { status: 'Error', event: 'ActionNotFound', payload: { message: `Action not registered: ${key}` } };
    }

    try {
      const result = await registered.implementation.execute(context);
      const declared = registered.manifest.results[result.status];
      if (result.event !== declared) {
        return {
          status: 'Error',
          event: registered.manifest.results.Error,
          payload: { message: `Implementation emitted ${result.event}, but manifest declares ${declared}` },
        };
      }
      return result;
    } catch (cause) {
      return {
        status: 'Error',
        event: registered.manifest.results.Error,
        payload: { message: cause instanceof Error ? cause.message : 'Unknown action failure' },
      };
    }
  }
}
