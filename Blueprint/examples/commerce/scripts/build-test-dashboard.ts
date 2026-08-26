import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const root=join(import.meta.dirname,'..');
async function walk(path:string):Promise<string[]>{const out:string[]=[];for(const e of await readdir(path,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=join(path,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.name==='result.json'&&p.includes(`${join('tests','')}`))out.push(p);}return out;}
const files=(await walk(root)).sort();const results=[];for(const file of files){try{results.push(JSON.parse(await readFile(file,'utf8')))}catch(e){throw new Error(`Invalid test result JSON: ${file}: ${String(e)}`)}}
await writeFile(join(root,'tests','dashboard','data.json'),JSON.stringify({generated_at:new Date().toISOString(),results},null,2)+'\n');console.log(`Dashboard data: ${results.length} results.`);
