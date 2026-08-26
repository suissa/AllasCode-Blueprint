import type { ActionResult } from './types.js';

export interface ToolImplementation {
  execute(input: unknown): Promise<ActionResult> | ActionResult;
}

interface ToolDefinition {
  ok: string;
  error: string;
  implementation: ToolImplementation;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(name: string, ok: string, error: string, implementation: ToolImplementation): void {
    this.tools.set(name, { ok, error, implementation });
  }

  async execute(name: string, input: unknown): Promise<ActionResult> {
    const tool = this.tools.get(name);
    if (!tool) return { status: 'Error', event: 'ToolNotFound', payload: { message: `Tool not registered: ${name}` } };
    try {
      const result = await tool.implementation.execute(input);
      const expected = result.status === 'Ok' ? tool.ok : tool.error;
      return result.event === expected
        ? result
        : { status: 'Error', event: tool.error, payload: { message: `Tool emitted ${result.event}, expected ${expected}` } };
    } catch (cause) {
      return { status: 'Error', event: tool.error, payload: { message: cause instanceof Error ? cause.message : 'Unknown tool failure' } };
    }
  }
}
