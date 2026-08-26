import { join } from 'node:path';
import { defineActionTests } from '../../../tests/action-harness.js';
import { recordAccountingEffect } from '../implementation/implementation.js';
const actionDir=join(import.meta.dirname,'..');
defineActionTests({name:'RecordAccountingEffect',manifest:{name:'RecordAccountingEffect',semantic_id:'commerce.action.record-accounting-effect',results:{Ok:'AccountingEffectRecorded',Error:'AccountingEffectRecordError'}},implementation:recordAccountingEffect,actionDir,valid(index=0){return{accounting_entry_id:`entry-${index}`,source_id:`sale-${index}`,source_type:'sale' as const,debit:0,credit:10+index,currency:'BRL' as const};},invalid(){return{};},assertEffect(state,payload){if(!state.accounting_entries.has(payload.accounting_entry_id))throw new Error('accounting entry not recorded');}});
