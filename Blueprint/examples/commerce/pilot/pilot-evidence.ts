export type PilotCheck='production-equivalent'|'real-purchase'|'sale-resolution'|'whatsapp-real-device'|'ui-no-db-edit'|'restart-recovery'|'backup-restore';
export type PilotEvidence={check:PilotCheck;status:'pending'|'passed'|'failed';at?:string;trace_id?:string;correlation_id?:string;business_id?:string;notes?:string};
export type PilotReport={environment:'staging';release:string;started_at:string;evidence:PilotEvidence[];blocking_defects:string[];ready_for_release:boolean};

export function createPilotReport(release:string):PilotReport{return{environment:'staging',release,started_at:new Date().toISOString(),evidence:[
 {check:'production-equivalent',status:'pending'},
 {check:'real-purchase',status:'pending'},
 {check:'sale-resolution',status:'pending'},
 {check:'whatsapp-real-device',status:'pending'},
 {check:'ui-no-db-edit',status:'pending'},
 {check:'restart-recovery',status:'pending'},
 {check:'backup-restore',status:'pending'},
],blocking_defects:[],ready_for_release:false};}

export function recordPilotEvidence(report:PilotReport,evidence:PilotEvidence):PilotReport{
 const next={...report,evidence:report.evidence.map(item=>item.check===evidence.check?evidence:item)};
 return evaluatePilot(next);
}
export function addBlockingDefect(report:PilotReport,id:string):PilotReport{return evaluatePilot({...report,blocking_defects:[...new Set([...report.blocking_defects,id])]});}
export function resolveBlockingDefect(report:PilotReport,id:string):PilotReport{return evaluatePilot({...report,blocking_defects:report.blocking_defects.filter(x=>x!==id)});}
export function evaluatePilot(report:PilotReport):PilotReport{return{...report,ready_for_release:report.blocking_defects.length===0&&report.evidence.every(e=>e.status==='passed')};}

export function assertExternalEvidence(e: PilotEvidence){
 if((e.check==='real-purchase'||e.check==='whatsapp-real-device')&&e.status==='passed'&&!e.correlation_id)throw new Error('ExternalPilotEvidenceRequired');
}
