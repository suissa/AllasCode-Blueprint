import { promises as fs } from 'node:fs';
import path from 'node:path';

export type PersistedRecord={id:string;kind:string;payload:Record<string,unknown>;version:number;updated_at:string};
export type PersistedEvent={event_id:string;stream_id:string;type:string;payload:Record<string,unknown>;occurred_at:string;correlation_id:string;idempotency_key:string};
export interface PersistencePort{get(kind:string,id:string):Promise<PersistedRecord|undefined>;list(kind:string):Promise<PersistedRecord[]>;appendEvent(event:PersistedEvent):Promise<{duplicate:boolean}>;events():Promise<PersistedEvent[]>;transaction<T>(fn:(tx:PersistenceTransaction)=>Promise<T>):Promise<T>;}
export interface PersistenceTransaction{put(record:PersistedRecord):Promise<void>;markIdempotency(key:string):Promise<boolean>;appendEvent(event:PersistedEvent):Promise<{duplicate:boolean}>;}

type State={records:Record<string,PersistedRecord>;events:PersistedEvent[];idempotency:string[];schema_version:number};
const empty=():State=>({records:{},events:[],idempotency:[],schema_version:1});
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
export class JsonFilePersistenceAdapter implements PersistencePort{
 private queue:Promise<unknown>=Promise.resolve();
 constructor(private readonly file:string){}
 private async read():Promise<State>{try{return JSON.parse(await fs.readFile(this.file,'utf8')) as State;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return empty();throw e;}}
 private async write(state:State){await fs.mkdir(path.dirname(this.file),{recursive:true});const tmp=`${this.file}.tmp`;await fs.writeFile(tmp,JSON.stringify(state));await fs.rename(tmp,this.file);}
 async get(kind:string,id:string){const s=await this.read();const r=s.records[`${kind}:${id}`];return r?clone(r):undefined;}
 async list(kind:string){const s=await this.read();return Object.values(s.records).filter(r=>r.kind===kind).map(clone);}
 async events(){return (await this.read()).events.map(clone);}
 async appendEvent(event:PersistedEvent){return this.transaction(tx=>tx.appendEvent(event));}
 async transaction<T>(fn:(tx:PersistenceTransaction)=>Promise<T>):Promise<T>{let release!:()=>void;const previous=this.queue;this.queue=new Promise<void>(r=>{release=r;});await previous;try{const state=await this.read();const working=clone(state);const tx:PersistenceTransaction={put:async record=>{working.records[`${record.kind}:${record.id}`]=clone(record);},markIdempotency:async key=>{if(working.idempotency.includes(key))return false;working.idempotency.push(key);return true;},appendEvent:async event=>{if(working.events.some(e=>e.event_id===event.event_id||e.idempotency_key===event.idempotency_key))return{duplicate:true};working.events.push(clone(event));return{duplicate:false};}};const out=await fn(tx);await this.write(working);return out;}finally{release();}}
}
export class Repository<T extends {id:string}>{constructor(private readonly kind:string,private readonly persistence:PersistencePort){}async get(id:string){const r=await this.persistence.get(this.kind,id);return r?.payload as T|undefined;}async list(){return (await this.persistence.list(this.kind)).map(r=>r.payload as T);}async save(entity:T,input:{version:number;updated_at:string;idempotency_key:string;event?:PersistedEvent}){return this.persistence.transaction(async tx=>{if(!await tx.markIdempotency(input.idempotency_key))return{duplicate:true};await tx.put({id:entity.id,kind:this.kind,payload:clone(entity) as Record<string,unknown>,version:input.version,updated_at:input.updated_at});if(input.event)await tx.appendEvent(input.event);return{duplicate:false};});}}
export const migrations=[{version:1,up:'initialize durable records/events/idempotency stores',down:'drop durable records/events/idempotency stores'}] as const;
