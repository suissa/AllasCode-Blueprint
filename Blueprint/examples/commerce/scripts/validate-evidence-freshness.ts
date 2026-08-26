import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root=join(import.meta.dirname,'..');
async function files(dir:string):Promise<string[]>{const out:string[]=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else out.push(p);}return out;}
function hash(parts:string[]):string{return createHash('sha256').update(parts.join('\n')).digest('hex');}
async function hashFiles(paths:string[]):Promise<string>{const parts:string[]=[];for(const p of [...paths].sort())parts.push(`${relative(root,p)}:${await readFile(p,'utf8')}`);return hash(parts);}
const all=await files(root);
const governanceHash=await hashFiles(all.filter(p=>p.includes('/governance/')&&/\.(ya?ml|json)$/.test(p)));
const graphContractHash=await hashFiles(all.filter(p=>p.includes('/graph/')||p.endsWith('/config.yml')));
const errors:string[]=[]; let fresh=0, stale=0;
for(const path of all.filter(p=>p.endsWith('/result.json')&&p.includes('/tests/'))){
 const r=JSON.parse(await readFile(path,'utf8')) as any;if(r.status!=='passed')continue;
 const artifactPath=join(root,String(r.artifact?.path??''));let artifactFiles:string[]=[];try{artifactFiles=(await stat(artifactPath)).isDirectory()?(await files(artifactPath)).filter(p=>!p.includes('/tests/')):[artifactPath];}catch{continue;}
 const impl=artifactFiles.filter(p=>p.includes('/implementation/')||/\.(ts|js|zig|rs|go|py)$/.test(p));
 const manifests=artifactFiles.filter(p=>/manifest\.ya?ml$/.test(p));
 const current={artifact_hash:await hashFiles(artifactFiles),implementation_hash:await hashFiles(impl),manifest_hash:await hashFiles(manifests),governance_hash:governanceHash,graph_contract_hash:graphContractHash};
 const mismatches=Object.entries(current).filter(([k,v])=>r.provenance?.[k]!==v).map(([k])=>k);
 if(mismatches.length){stale++;errors.push(`${relative(root,path)} stale: ${mismatches.join(', ')}`);}else fresh++;
}
if(errors.length)throw new Error(`Evidence freshness gate rejected build (${stale} stale):\n- ${errors.join('\n- ')}`);
console.log(`Evidence freshness gate passed: ${fresh} fresh TestResults, 0 stale.`);
