import {createPilotReport,recordPilotEvidence,addBlockingDefect,resolveBlockingDefect,type PilotReport,type PilotEvidence} from '../pilot/pilot-evidence.js';
import {RealOperatorAcceptance,type OperatorTask} from './operator-usability.js';

export type RealAcceptanceSessionInput={
 release_candidate:string;
 operator_id:string;
 session_id:string;
 started_at:string;
 completed_at:string;
 developer_assistance:boolean;
 database_access:boolean;
};

export class RealAcceptanceSession{
 private pilot: PilotReport;
 private operator=new RealOperatorAcceptance();
 constructor(private readonly input:RealAcceptanceSessionInput){
  if(!input.operator_id.trim())throw new Error('RealOperatorIdentityRequired');
  if(!input.session_id.trim())throw new Error('RealSessionIdRequired');
  if(input.developer_assistance)throw new Error('DeveloperAssistanceInvalidatesAcceptance');
  if(input.database_access)throw new Error('DatabaseAccessInvalidatesAcceptance');
  this.pilot=createPilotReport(input.release_candidate);
 }
 recordPilot(evidence:PilotEvidence){this.pilot=recordPilotEvidence(this.pilot,evidence);return this;}
 recordOperator(task:OperatorTask,correlation_ids:string[]){this.operator.record({operator_id:this.input.operator_id,session_id:this.input.session_id,started_at:this.input.started_at,completed_at:this.input.completed_at,passed:true,developer_assistance:false,database_access:false,task,correlation_ids});return this;}
 defect(id:string,severity:'critical'|'high'|'medium'|'low',summary:string,open=true){if((severity==='critical'||severity==='high')&&open)this.pilot=addBlockingDefect(this.pilot,id);else if(!open)this.pilot=resolveBlockingDefect(this.pilot,id);this.operator.defect({id,severity,status:open?'open':'closed',blocks_critical_workflow:severity==='critical'||severity==='high',summary});return this;}
 status(){const operator=this.operator.status();return{pilot:this.pilot,operator,ready:this.pilot.ready_for_release&&operator.ready};}
}
