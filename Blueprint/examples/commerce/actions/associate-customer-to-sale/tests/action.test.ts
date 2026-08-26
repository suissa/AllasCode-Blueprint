import { join } from 'node:path';
import { defineActionTests } from '../../../tests/action-harness.js';
import { associateCustomerToSale } from '../implementation/implementation.js';
const actionDir=join(import.meta.dirname,'..');
defineActionTests({name:'AssociateCustomerToSale',manifest:{name:'AssociateCustomerToSale',semantic_id:'commerce.action.associate-customer-to-sale',results:{Ok:'CustomerAssociatedToSale',Error:'CustomerAssociationError'}},implementation:associateCustomerToSale,actionDir,valid(index=0){return{sale_id:`sale-${index}`,customer_id:`customer-${index}`};},invalid(){return{};},setup(state,payload){state.sales.set(payload.sale_id,{sale_id:payload.sale_id,currency:'BRL',items:[]});},assertEffect(state,payload){if(state.sales.get(payload.sale_id)?.customer_id!==payload.customer_id)throw new Error('customer not associated');}});
