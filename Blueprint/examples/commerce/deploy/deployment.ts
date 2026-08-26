export type ReleaseRecord={version:string;applied_migrations:string[];ready:boolean};
export class MigrationLedger{private readonly applied=new Set<string>();apply(id:string){if(this.applied.has(id))return false;this.applied.add(id);return true;}snapshot(){return [...this.applied];}}
export class DeploymentController{
 private current:ReleaseRecord|undefined; private previous:ReleaseRecord|undefined;
 constructor(private readonly migrations:MigrationLedger){}
 deploy(version:string,migrationIds:string[],checks:{health:boolean;readiness:boolean}):ReleaseRecord{
  if(!/^v1\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))throw new Error('InvalidV1ReleaseTag');
  const before=this.migrations.snapshot();
  for(const id of migrationIds)this.migrations.apply(id);
  if(!checks.health||!checks.readiness){for(const id of this.migrations.snapshot())if(!before.includes(id)){};throw new Error('ReleaseNotReady');}
  this.previous=this.current;
  const release={version,applied_migrations:this.migrations.snapshot(),ready:true};
  this.current=release;
  return release;
 }
 rollback():ReleaseRecord{
  if(!this.previous)throw new Error('NoRollbackTarget');
  const target=this.previous;
  const failed=this.current;
  this.current=target;
  this.previous=failed;
  return target;
 }
 status(){return this.current;}
}
export function readiness(input:{configLoaded:boolean;database:boolean;eventBus:boolean;cache:boolean;migrationsCurrent:boolean}){return Object.values(input).every(Boolean);}
export function health(){return {status:'ok' as const};}
