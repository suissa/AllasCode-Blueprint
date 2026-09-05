import {createHash} from 'node:crypto';

export type MasterEntity='product'|'customer'|'supplier';
export type ImportFormat='csv'|'json';
export type ImportError={code:string;message:string;fields?:string[]};
export type ValidationResult=
 |{outcome:'Ok';canonical_key:string;value:Record<string,unknown>}
 |{outcome:'Error';error:ImportError};

export interface SemanticMasterDataValidator{validate(entity:MasterEntity,row:Record<string,unknown>,rowIndex:number):Promise<ValidationResult>|ValidationResult;}
export interface ImportTransaction{put(entity:MasterEntity,canonicalKey:string,value:Record<string,unknown>):Promise<void>;recordFingerprint(fingerprint:string):Promise<void>;commit():Promise<void>;rollback():Promise<void>;}
export type ImportMigrationMetadata={migration_id:string;schema_version:string;entity:MasterEntity;source_digest:string;imported_at:string;rows_total:number;rows_imported:number;rows_duplicate:number;rows_error:number;};
export interface ImportStore{exists(entity:MasterEntity,canonicalKey:string):Promise<boolean>;hasFingerprint(fingerprint:string):Promise<boolean>;begin():Promise<ImportTransaction>;migration(id:string):Promise<ImportMigrationMetadata|undefined>;recordMigration(metadata:ImportMigrationMetadata):Promise<void>;}

export type RowResult={row:number;status:'would-import'|'imported'|'duplicate'|'error';canonical_key?:string;fingerprint?:string;error?:ImportError};
export type ImportReport={migration_id:string;schema_version:string;entity:MasterEntity;format:ImportFormat;dry_run:boolean;source_digest:string;rows:RowResult[];summary:{total:number;imported:number;would_import:number;duplicate:number;error:number};};

export class MasterDataImporter{
 constructor(private readonly validator:SemanticMasterDataValidator,private readonly store:ImportStore){}
 async run(input:{migration_id:string;schema_version:string;entity:MasterEntity;format:ImportFormat;content:string;dry_run?:boolean}):Promise<ImportReport>{
  const dryRun=input.dry_run===true;
  const sourceDigest=sha(input.content);
  const previous=await this.store.migration(input.migration_id);
  if(previous&&previous.source_digest!==sourceDigest)throw new Error('MigrationIdConflict');
  const records=parse(input.format,input.content);
  const rows:RowResult[]=[];
  const seen=new Set<string>();
  for(let i=0;i<records.length;i++){
   const rowNumber=i+1;
   const validation=await this.validator.validate(input.entity,records[i]!,rowNumber);
   if(validation.outcome==='Error'){rows.push({row:rowNumber,status:'error',error:validation.error});continue;}
   const key=validation.canonical_key;
   const fingerprint=sha(stable({entity:input.entity,schema_version:input.schema_version,canonical_key:key,value:validation.value}));
   if(seen.has(key)){rows.push({row:rowNumber,status:'error',canonical_key:key,fingerprint,error:{code:'DUPLICATE_IN_SOURCE',message:`Duplicate canonical key ${key} in source`}});continue;}
   seen.add(key);
   if(await this.store.hasFingerprint(fingerprint)){rows.push({row:rowNumber,status:'duplicate',canonical_key:key,fingerprint});continue;}
   if(await this.store.exists(input.entity,key)){rows.push({row:rowNumber,status:'error',canonical_key:key,fingerprint,error:{code:'DUPLICATE_NATURAL_KEY',message:`${input.entity} ${key} already exists with different data`}});continue;}
   if(dryRun){rows.push({row:rowNumber,status:'would-import',canonical_key:key,fingerprint});continue;}
   const tx=await this.store.begin();
   try{await tx.put(input.entity,key,validation.value);await tx.recordFingerprint(fingerprint);await tx.commit();rows.push({row:rowNumber,status:'imported',canonical_key:key,fingerprint});}
   catch(error){await tx.rollback();rows.push({row:rowNumber,status:'error',canonical_key:key,fingerprint,error:{code:'PERSISTENCE_ERROR',message:error instanceof Error?error.message:String(error)}});}
  }
  const summary={total:rows.length,imported:rows.filter(r=>r.status==='imported').length,would_import:rows.filter(r=>r.status==='would-import').length,duplicate:rows.filter(r=>r.status==='duplicate').length,error:rows.filter(r=>r.status==='error').length};
  if(!dryRun&&!previous)await this.store.recordMigration({migration_id:input.migration_id,schema_version:input.schema_version,entity:input.entity,source_digest:sourceDigest,imported_at:new Date().toISOString(),rows_total:summary.total,rows_imported:summary.imported,rows_duplicate:summary.duplicate,rows_error:summary.error});
  return{migration_id:input.migration_id,schema_version:input.schema_version,entity:input.entity,format:input.format,dry_run:dryRun,source_digest:sourceDigest,rows,summary};
 }
}

function parse(format:ImportFormat,content:string):Record<string,unknown>[]{
 if(format==='json'){
  const value=JSON.parse(content) as unknown;
  if(!Array.isArray(value))throw new Error('JsonImportMustBeArray');
  return value.map((row,i)=>{if(!row||typeof row!=='object'||Array.isArray(row))throw new Error(`JsonRowMustBeObject:${i+1}`);return row as Record<string,unknown>;});
 }
 return parseCsv(content);
}

export function parseCsv(content:string):Record<string,string>[] {
 const matrix:string[][]=[];let row:string[]=[];let field='';let quoted=false;
 const text=content.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i]!;
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else quoted=false;}else field+=c;continue;}
  if(c==='"'){quoted=true;continue;}if(c===','){row.push(field);field='';continue;}
  if(c==='\n'){row.push(field);field='';if(row.some(v=>v.trim()!==''))matrix.push(row);row=[];continue;}
  if(c==='\r')continue;field+=c;
 }
 row.push(field);if(row.some(v=>v.trim()!==''))matrix.push(row);
 if(quoted)throw new Error('CsvUnclosedQuote');
 const headers=matrix.shift()?.map(h=>h.trim())??[];
 if(headers.length===0)throw new Error('CsvHeaderRequired');
 if(new Set(headers).size!==headers.length)throw new Error('CsvDuplicateHeader');
 return matrix.map((values,index)=>{if(values.length!==headers.length)throw new Error(`CsvColumnCount:${index+2}`);return Object.fromEntries(headers.map((h,i)=>[h,values[i]??'']));});
}

function stable(value:unknown):string{
 if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;
 if(value&&typeof value==='object')return`{${Object.keys(value as Record<string,unknown>).sort().map(k=>`${JSON.stringify(k)}:${stable((value as Record<string,unknown>)[k])}`).join(',')}}`;
 const encoded=JSON.stringify(value);
 return encoded===undefined?'null':encoded;
}
function sha(value:string):string{return createHash('sha256').update(value).digest('hex');}
