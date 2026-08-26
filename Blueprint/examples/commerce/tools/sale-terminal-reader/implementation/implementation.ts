import type { ToolImplementation } from '../../../runtime/tool-registry.js';

export const saleTerminalReader: ToolImplementation = {
  async execute(input) {
    if (!input || typeof input !== 'object' || !('sale' in input)) {
      return { status: 'Error', event: 'SaleTerminalReadError', payload: { message: 'sale is required' } };
    }
    return { status: 'Ok', event: 'SaleTerminalRead', payload: { sale: (input as { sale: unknown }).sale } };
  },
};
