import type { ExecutionReport } from './types.js';
import type { FlowRuntime } from './flow-runtime.js';
import type { HealingCase, HealingCaseStore } from './healing-store.js';

export interface PendingHealingCase {
  id: string;
  intent: string;
  agent: string;
  action: string;
  original_event: string;
  original_payload: unknown;
  original_payload_hash: string;
  error_event: string;
  error_message: string;
  correlation_id: string;
  resume_token: string;
  created_at: string;
  expires_at: string;
  attempts: number;
}

function project(value:HealingCase):PendingHealingCase{
  const {status:_status,...rest}=value;
  return rest;
}

export class OperatorHealingApi {
  constructor(private readonly runtime:FlowRuntime,private readonly store:HealingCaseStore=runtime.healingStore){}

  listPending():PendingHealingCase[]{ return this.store.listPending().map(project); }
  getPending(caseId:string):PendingHealingCase|undefined {
    const value=this.store.get(caseId);
    return value?.status==='pending-human'?project(value):undefined;
  }
  async submitResolution(input:{case_id:string;resume_token:string;payload:unknown}):Promise<ExecutionReport>{
    return this.runtime.resume(input.case_id,input.resume_token,input.payload);
  }
  auditLog(){ return this.store.auditLog(); }
}
