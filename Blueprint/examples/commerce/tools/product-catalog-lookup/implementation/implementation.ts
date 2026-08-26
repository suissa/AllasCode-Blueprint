import type { ToolImplementation } from '../../../runtime/tool-registry.js';

const catalog = new Map([
  ['beer-350', { product_id: 'beer-350', name: 'Beer 350ml' }],
  ['water-500', { product_id: 'water-500', name: 'Water 500ml' }],
]);

export const productCatalogLookup: ToolImplementation = {
  async execute(input) {
    const productId = input && typeof input === 'object' ? (input as { product_id?: unknown }).product_id : undefined;
    if (typeof productId !== 'string') {
      return { status: 'Error', event: 'ProductResolutionError', payload: { message: 'product_id is required' } };
    }
    const product = catalog.get(productId);
    return product
      ? { status: 'Ok', event: 'ProductResolved', payload: { product } }
      : { status: 'Error', event: 'ProductResolutionError', payload: { message: `Unknown product: ${productId}` } };
  },
};
