export class BoundedAsyncQueue<T>{
 private readonly pending:T[]=[]; private running=0; private accepted=0; private completed=0;
 constructor(private readonly capacity:number,private readonly workers:number,private readonly handler:(item:T)=>Promise<void>){if(capacity<1||workers<1)throw new Error('InvalidQueueLimits');}
 enqueue(item:T):boolean{if(this.pending.length+this.running>=this.capacity)return false;this.pending.push(item);this.accepted++;this.pump();return true;}
 private pump(){while(this.running<this.workers&&this.pending.length){const item=this.pending.shift()!;this.running++;void this.handler(item).finally(()=>{this.running--;this.completed++;this.pump();});}}
 stats(){return{capacity:this.capacity,queued:this.pending.length,running:this.running,accepted:this.accepted,completed:this.completed};}
 async drain(){while(this.pending.length||this.running)await new Promise(r=>setTimeout(r,1));}
}

export class KeyedSerialExecutor{
 private readonly tails=new Map<string,Promise<unknown>>();
 async run<T>(key:string,task:()=>Promise<T>):Promise<T>{
  const previous=this.tails.get(key)??Promise.resolve();
  let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});
  const tail=previous.catch(()=>undefined).then(()=>gate);this.tails.set(key,tail);
  await previous.catch(()=>undefined);
  try{return await task();}finally{release();if(this.tails.get(key)===tail)this.tails.delete(key);}
 }
 size(){return this.tails.size;}
}
