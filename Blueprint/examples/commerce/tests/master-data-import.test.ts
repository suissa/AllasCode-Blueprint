import test from 'node:test';
import assert from 'node:assert/strict';
import {MasterDataImporter,parseCsv,type ImportMigrationMetadata,type ImportStore,type ImportTransaction,type MasterEntity,type SemanticMasterDataValidator} from '../import/master-data-import.js';

class MemoryStore implements ImportStore{
 readonly records=new Map<string,Record<string,unknown>>();
 readonly fingerprints=new Set<string>();
 readonly migrations=new Map<string,ImportMigrationMetadata>();
 readonly rollbacks:string[]=[];
 failKey:string|undefined;
 key(entity:MasterEntity,canonicalKey:string){return `${entity}:${canonicalKey}`;}
 async exists(entity:MasterEntity,canonicalKey:string){return this.records.has(this.key(entity,canonicalKey));}
 async hasFingerprint(fingerprint:string){return this.fingerprints.has(fingerprint);}
 async migration(id:string){return this.migrations.get(id);}
 async recordMigration(metadata:ImportMigrationMetadata){this.migrations.set(metadata.migration_id,metadata);}
 async begin():Promise<ImportTransaction>{
  let pending:{entity:MasterEntity;key:string;value:Record<string,unknown>}|undefined;let fingerprint:string|undefined;const store=this;
  return{
   async put(entity,canonicalKey,value){if(store.failKey===canonicalKey)throw new Error('simulated write failure');pending={entity,key:canonicalKey,value};},
   async recordFingerprint(value){fingerprint=value;},
   async commit(){if(!pending||!fingerprint)throw new Error('incomplete transaction');store.records.set(store.key(pending.entity,pending.key),pending.value);store.fingerprints.add(fingerprint);},
   async rollback(){if(pending)store.rollbacks.push(pending.key);else store.rollbacks.push(store.failKey??'unknown');pending=undefined;fingerprint=undefined;},
  };
 }
}

const validator:SemanticMasterDataValidator={validate(entity,row){
 const name=String(row.name??'').trim();
 if(!name)return{outcome:'Error',error:{code:'NAME_REQUIRED',message:`${entity} name is required`,fields:['name']}};
 const external=String(row.external_id??name.toLowerCase()).trim().toLowerCase();
 return{outcome:'Ok',canonical_key:`${entity}:${external}`,value:{...row,name,external_id:external}};
}};

test('CSV parser supports quoted commas and escaped quotes',()=>{assert.deepEqual(parseCsv('external_id,name\n1,"ACME, Ltd"\n2,"Say ""Hi"""'),[{external_id:'1',name:'ACME, Ltd'},{external_id:'2',name:'Say "Hi"'}]);});

test('CSV import validates semantically and records migration metadata',async()=>{const store=new MemoryStore();const importer=new MasterDataImporter(validator,store);const report=await importer.run({migration_id:'seed-products-v1',schema_version:'1',entity:'product',format:'csv',content:'external_id,name\np1,Water\np2,Soda'});assert.equal(report.summary.imported,2);assert.equal(store.records.size,2);assert.equal(store.migrations.get('seed-products-v1')?.schema_version,'1');});

test('JSON partial validation failure does not abort valid rows',async()=>{const store=new MemoryStore();const importer=new MasterDataImporter(validator,store);const report=await importer.run({migration_id:'customers-v1',schema_version:'1',entity:'customer',format:'json',content:JSON.stringify([{external_id:'c1',name:'Ana'},{external_id:'c2',name:''},{external_id:'c3',name:'Bia'}])});assert.equal(report.summary.imported,2);assert.equal(report.summary.error,1);assert.equal(report.rows[1]?.error?.code,'NAME_REQUIRED');assert.equal(store.records.size,2);});

test('dry run previews duplicates and never persists or records migration',async()=>{const store=new MemoryStore();store.records.set('supplier:supplier:s1',{name:'Existing'});const importer=new MasterDataImporter(validator,store);const report=await importer.run({migration_id:'suppliers-preview',schema_version:'1',entity:'supplier',format:'json',content:JSON.stringify([{external_id:'s1',name:'Existing changed'},{external_id:'s2',name:'New'}]),dry_run:true});assert.deepEqual(report.rows.map(r=>r.status),['error','would-import']);assert.equal(store.records.size,1);assert.equal(store.migrations.size,0);});

test('same source is safely repeatable by fingerprint',async()=>{const store=new MemoryStore();const importer=new MasterDataImporter(validator,store);const input={migration_id:'repeat-v1',schema_version:'1',entity:'product' as const,format:'json' as const,content:JSON.stringify([{external_id:'p1',name:'Water'}])};const first=await importer.run(input);const second=await importer.run(input);assert.equal(first.summary.imported,1);assert.equal(second.summary.duplicate,1);assert.equal(store.records.size,1);});

test('migration id cannot silently point to different source content',async()=>{const store=new MemoryStore();const importer=new MasterDataImporter(validator,store);await importer.run({migration_id:'same-id',schema_version:'1',entity:'product',format:'json',content:JSON.stringify([{external_id:'p1',name:'Water'}])});await assert.rejects(()=>importer.run({migration_id:'same-id',schema_version:'1',entity:'product',format:'json',content:JSON.stringify([{external_id:'p2',name:'Soda'}])}),/MigrationIdConflict/);});

test('persistence failure rolls back one row and later rows continue',async()=>{const store=new MemoryStore();store.failKey='product:p2';const importer=new MasterDataImporter(validator,store);const report=await importer.run({migration_id:'partial-write-v1',schema_version:'1',entity:'product',format:'json',content:JSON.stringify([{external_id:'p1',name:'Water'},{external_id:'p2',name:'Soda'},{external_id:'p3',name:'Juice'}])});assert.deepEqual(report.rows.map(r=>r.status),['imported','error','imported']);assert.equal(report.rows[1]?.error?.code,'PERSISTENCE_ERROR');assert.ok(store.rollbacks.includes('product:p2'));assert.equal(store.records.size,2);});

test('duplicate canonical key inside one source is rejected without duplicate write',async()=>{const store=new MemoryStore();const importer=new MasterDataImporter(validator,store);const report=await importer.run({migration_id:'source-dup-v1',schema_version:'1',entity:'supplier',format:'json',content:JSON.stringify([{external_id:'s1',name:'A'},{external_id:'s1',name:'A again'}])});assert.equal(report.summary.imported,1);assert.equal(report.summary.error,1);assert.equal(report.rows[1]?.error?.code,'DUPLICATE_IN_SOURCE');});
