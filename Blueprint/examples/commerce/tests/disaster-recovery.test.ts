import test from 'node:test';
import assert from 'node:assert/strict';
import { ObservabilityRuntime } from '../runtime/observability.js';
import { DisasterRecoveryRuntime, type RestoreTarget } from '../runtime/disaster-recovery.js';

function targetHarness(){ const writes:any[]=[]; const eventIds:string[]=[]; const idempotency:string[]=[]; const target:RestoreTarget={write:(store,records)=>{writes.push({store,records});},registerEventIds:ids=>{eventIds.push(...ids);},registerIdempotencyKeys:keys=>{idempotency.push(...keys);}}; return {target,writes,eventIds,idempotency}; }

test('backup and restore preserve events and idempotency integrity',async()=>{
 const obs=new ObservabilityRuntime(); const dr=new DisasterRecoveryRuntime(obs); const ctx=obs.context();
 const bundle=dr.createBackup([{store:'event-store',version:1,records:[{id:'e1',type:'SaleCompleted'}],event_ids:['e1'],idempotency_keys:['sale-1']}],ctx);
 const h=targetHarness(); await dr.restore(bundle,h.target,ctx);
 assert.deepEqual(h.eventIds,['e1']); assert.deepEqual(h.idempotency,['sale-1']); assert.equal(h.writes[0].store,'event-store');
});

test('tampered backup is rejected before restore',async()=>{
 const obs=new ObservabilityRuntime(); const dr=new DisasterRecoveryRuntime(obs); const ctx=obs.context();
 const bundle=dr.createBackup([{store:'primary',version:1,records:[{value:1}],event_ids:[],idempotency_keys:[]}],ctx);
 bundle.stores[0]!.records=[{value:2}]; const h=targetHarness();
 await assert.rejects(()=>dr.restore(bundle,h.target,ctx),/BackupChecksumMismatch/); assert.equal(h.writes.length,0);
});

test('duplicate event or idempotency identities invalidate backup',()=>{
 const obs=new ObservabilityRuntime(); const dr=new DisasterRecoveryRuntime(obs); const ctx=obs.context();
 const a=dr.createBackup([{store:'events',version:1,records:[],event_ids:['e1','e1'],idempotency_keys:[]}],ctx); assert.throws(()=>dr.verify(a),/DuplicateEventId/);
 const b=dr.createBackup([{store:'commands',version:1,records:[],event_ids:[],idempotency_keys:['k1','k1']}],ctx); assert.throws(()=>dr.verify(b),/DuplicateIdempotencyKey/);
});

test('disaster recovery rehearsal succeeds against clean target',async()=>{
 const obs=new ObservabilityRuntime(); const dr=new DisasterRecoveryRuntime(obs); const ctx=obs.context();
 const bundle=dr.createBackup([{store:'commerce',version:1,records:[{sale_id:'s1'}],event_ids:['event-s1'],idempotency_keys:['idem-s1']}],ctx); const h=targetHarness();
 const result=await dr.rehearse(bundle,h.target,ctx); assert.equal(result.status,'Ok'); assert.ok(obs.traces.some(t=>t.name==='DisasterRecoveryRehearsal'&&t.status==='Ok'));
});
