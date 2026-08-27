export type HarnessAction='AgentHarness.prepare'|'AgentHarness.invoke'|'AgentHarness.observe'|'AgentHarness.evaluate'|'AgentHarness.finalize';
export type HarnessErrorCode='UnauthorizedAgent'|'CrossContextDenied'|'DeadlineExceeded'|'InvalidAgentOutput'|'DuplicateInvocation'|'AgentFailure';
export type HarnessOk<T=unknown>={outcome:'Ok';action:HarnessAction;value:T;correlation_id:string};
export type HarnessError={outcome:'Error';action:HarnessAction;code:HarnessErrorCode;correlation_id:string;details?:string};
export type HarnessResult<T=unknown>=HarnessOk<T>|HarnessError;
export type AgentInvocation={agent_id:string;context_id:string;payload:unknown;correlation_id:string;causation_id:string;idempotency_key:string;deadline_at:string;required_capability:string};
export type AgentExecutionPort={invoke(input:AgentInvocation):Promise<unknown>};
export type HarnessAuthorizationPort={authorize(input:{agent_id:string;context_id:string;capability:string}):boolean};
export type OutputContractPort={validate(output:unknown):boolean};
export type HarnessEvidence={action:HarnessAction;at:string;outcome:'Ok'|'Error';code?:HarnessErrorCode};

export class AgentHarness{
 private readonly completed=new Map<string,HarnessResult>();
 private readonly evidence:HarnessEvidence[]=[];
 constructor(private readonly execution:AgentExecutionPort,private readonly authorization:HarnessAuthorizationPort,private readonly contract:OutputContractPort,private readonly now:()=>Date=()=>new Date()){}
 private record<T>(result:HarnessResult<T>):HarnessResult<T>{this.evidence.push({action:result.action,at:this.now().toISOString(),outcome:result.outcome,...(result.outcome==='Error'?{code:result.code}:{})});return result;}
 prepare(input:AgentInvocation):HarnessResult<AgentInvocation>{const action='AgentHarness.prepare' as const;if(!this.authorization.authorize({agent_id:input.agent_id,context_id:input.context_id,capability:input.required_capability}))return this.record({outcome:'Error',action,code:'UnauthorizedAgent',correlation_id:input.correlation_id});if(this.now().getTime()>new Date(input.deadline_at).getTime())return this.record({outcome:'Error',action,code:'DeadlineExceeded',correlation_id:input.correlation_id});return this.record({outcome:'Ok',action,value:{...input},correlation_id:input.correlation_id});}
 async invoke(input:AgentInvocation):Promise<HarnessResult<unknown>>{const action='AgentHarness.invoke' as const;const duplicate=this.completed.get(input.idempotency_key);if(duplicate)return {...duplicate,action} as HarnessResult<unknown>;const prepared=this.prepare(input);if(prepared.outcome==='Error')return prepared;try{const output=await this.execution.invoke(input);if(this.now().getTime()>new Date(input.deadline_at).getTime())return this.record({outcome:'Error',action,code:'DeadlineExceeded',correlation_id:input.correlation_id});const result=this.record({outcome:'Ok',action,value:output,correlation_id:input.correlation_id});this.completed.set(input.idempotency_key,result);return result;}catch(error){return this.record({outcome:'Error',action,code:'AgentFailure',correlation_id:input.correlation_id,details:error instanceof Error?error.message:String(error)});}}
 observe(correlation_id:string):HarnessResult<HarnessEvidence[]>{return this.record({outcome:'Ok',action:'AgentHarness.observe',value:this.evidence.map(x=>({...x})),correlation_id});}
 evaluate(correlation_id:string,output:unknown):HarnessResult<unknown>{const action='AgentHarness.evaluate' as const;if(!this.contract.validate(output))return this.record({outcome:'Error',action,code:'InvalidAgentOutput',correlation_id});return this.record({outcome:'Ok',action,value:output,correlation_id});}
 finalize(correlation_id:string,result:HarnessResult):HarnessResult<{result:HarnessResult;evidence:HarnessEvidence[]}>{return this.record({outcome:'Ok',action:'AgentHarness.finalize',value:{result,evidence:this.evidence.map(x=>({...x}))},correlation_id});}
}
