export type OperatorTask='manage-master-data'|'purchase-ui'|'purchase-whatsapp'|'resolve-sale-whatsapp'|'verify-sale-ui'|'resolve-healing';
export type OperatorTaskEvidence={task:OperatorTask;passed:boolean;operator_id:string;session_id:string;started_at:string;completed_at?:string;notes?:string;correlation_ids?:string[];developer_assistance:boolean;database_access:boolean};
export type UsabilityDefect={id:string;severity:'critical'|'high'|'medium'|'low';status:'open'|'closed';blocks_critical_workflow:boolean;summary:string};
export class RealOperatorAcceptance{
 private readonly evidence=new Map<OperatorTask,OperatorTaskEvidence>();
 private readonly defects=new Map<string,UsabilityDefect>();
 record(input:OperatorTaskEvidence){if(!input.operator_id||!input.session_id)throw new Error('RealOperatorIdentityRequired');if(input.developer_assistance)throw new Error('DeveloperAssistanceInvalidatesAcceptance');if(input.database_access)throw new Error('DatabaseAccessInvalidatesAcceptance');this.evidence.set(input.task,input);}
 defect(input:UsabilityDefect){this.defects.set(input.id,input);}
 required():OperatorTask[]{return ['manage-master-data','purchase-ui','purchase-whatsapp','resolve-sale-whatsapp','verify-sale-ui','resolve-healing'];}
 status(){const required=this.required();const missing=required.filter(t=>!this.evidence.get(t)?.passed);const blocking=[...this.defects.values()].filter(d=>d.status==='open'&&(d.blocks_critical_workflow||d.severity==='critical'||d.severity==='high'));return{ready:missing.length===0&&blocking.length===0,missing,blocking,evidence:[...this.evidence.values()]};}
}
