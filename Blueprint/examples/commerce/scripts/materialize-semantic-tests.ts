import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { parse } from 'yaml';

const root = join(import.meta.dirname, '..');
const ALL = ['unit','bdd','load','stress','synk','security','integration','e2e','benchmark'] as const;
const ACTION_EXCLUSIONS = new Set(['bdd','e2e']);
const components: Record<string,string[]> = {
  unit:['summary-card','table','donut'], bdd:['summary-card','table','timeline'], load:['summary-card','line','histogram'],
  stress:['summary-card','line','gauge'], synk:['summary-card','table','status'], security:['summary-card','table','donut'],
  integration:['summary-card','timeline','table'], e2e:['summary-card','timeline','status'], benchmark:['summary-card','bar','line'],
};
const intents: Record<string,string> = {
  unit:'Prove the artifact in isolation against its semantic contract.', bdd:'Prove human-readable behavior scenarios and acceptance semantics.',
  load:'Prove expected sustained workload behavior.', stress:'Find the breaking point and prove recovery beyond expected capacity.',
  synk:'Scan dependency and vulnerability synchronization semantics; the provider may be Snyk.', security:'Prove security boundaries, policies, misuse resistance and controls.',
  integration:'Prove contracts across artifact boundaries.', e2e:'Prove an Intent from external trigger to terminal semantic outcome.',
  benchmark:'Measure a stable baseline and comparable performance metrics.',
};
const metricIds: Record<string,string[]> = {
  unit:['assertions_total','assertions_passed','coverage_percent'], bdd:['scenarios_total','scenarios_passed','steps_passed'],
  load:['requests_total','throughput_rps','p95_ms'], stress:['peak_virtual_users','breaking_point','recovery_ms'],
  synk:['dependencies_scanned','vulnerabilities_total','high_findings'], security:['checks_total','findings_total','critical_findings'],
  integration:['contracts_total','contracts_passed','latency_ms'], e2e:['steps_total','steps_passed','duration_ms'],
  benchmark:['ops_per_second','mean_ms','p95_ms'],
};

async function walk(path:string):Promise<string[]> { const out:string[]=[]; for(const e of await readdir(path,{withFileTypes:true})){ if(['node_modules','.git','tests','generated'].includes(e.name)) continue; const p=join(path,e.name); if(e.isDirectory()) out.push(...await walk(p)); else if(e.name==='manifest.yml') out.push(p); } return out; }
function kindOf(m:Record<string,unknown>, path:string):string { return String(m.kind ?? (path.includes('/actions/')?'action':path.includes('/actors/')?'actor':path.includes('/agents/')?'agent':path.includes('/tools/')?'tool':path.includes('/entities/')?'entity':'artifact')); }
function cfg(type:string):string { const v:Record<string,string>={unit:'isolation: true\nmock_external_boundaries: true',bdd:'syntax: gherkin\nacceptance_source: semantic_behavior',load:'workload:\n  mode: sustained\n  virtual_users: 10\n  duration_seconds: 30',stress:'workload:\n  mode: ramp-until-limit\n  max_virtual_users: 100\n  recovery_required: true',synk:'provider_hint: snyk\nscan:\n  dependencies: true\n  vulnerabilities: true\n  fail_on: high',security:'checks:\n  authorization: true\n  input_abuse: true\n  secret_exposure: true\n  policy_enforcement: true',integration:'boundaries: semantic-contracts\nrequire_event_schema_compatibility: true',e2e:'scope: intent-to-terminal-event\nrequire_terminal_event: true',benchmark:'baseline: required\nwarmup_iterations: 3\nmeasure_iterations: 10'}; return v[type]!; }
function detailHtml():string { return `<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"><title>Semantic Test Result</title></head><body class="bg-slate-950 text-slate-100 min-h-screen p-6"><main id="app" class="max-w-4xl mx-auto"></main><script type="module">const r=await fetch('./result.json').then(x=>x.json());document.querySelector('#app').innerHTML=\`<article class="animate__animated animate__fadeIn rounded-2xl border border-slate-800 bg-slate-900 p-6"><div class="text-cyan-400 text-xs uppercase tracking-widest">\${r.test.type}</div><h1 class="text-2xl font-semibold mt-1">\${r.artifact.id}</h1><p class="text-slate-400 mt-2">Status: <b>\${r.status}</b></p><pre class="mt-6 bg-slate-950 rounded-xl p-4 overflow-auto text-sm">\${JSON.stringify(r,null,2)}</pre></article>\`</script></body></html>`; }
function result(kind:string,id:string,path:string,type:string){ const ids=metricIds[type]!; const metrics=ids.map(mid=>({id:mid,label:mid.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()),value:0,unit:mid.includes('percent')?'%':mid.endsWith('_ms')?'ms':mid.endsWith('_rps')?'rps':'count',status:'unknown'})); const cs=components[type]!; return {$schema:'https://allascode.dev/schemas/test-result/v1.json',version:'1.0.0',id:`${kind}.${id}.${type}.pending`,artifact:{kind,id,path},test:{type,name:`${type}::${id}`,description:intents[type]},status:'not-run',timing:{started_at:null,finished_at:null,duration_ms:0},metrics,presentation:{components:[{type:cs[0],title:'Summary',metrics:ids.slice(0,2)},{type:cs[1],title:'Metrics',metrics:ids},{type:cs[2],title:'Signal',metrics:[ids.at(-1)]}]},evidence:[],errors:[],environment:{},metadata:{generated:true}}; }

for(const manifestPath of await walk(root)){
  const artifactDir=dirname(manifestPath); if(artifactDir===root) continue;
  const manifest=parse(await readFile(manifestPath,'utf8')) as Record<string,unknown>; const kind=kindOf(manifest,artifactDir); const id=String(manifest.name ?? manifest.id ?? basename(artifactDir));
  const types=ALL.filter(t=>!(kind==='action' && ACTION_EXCLUSIONS.has(t))); const artifactPath=relative(root,artifactDir).replaceAll('\\','/');
  for(const type of types){ const base=join(artifactDir,'tests',type); await mkdir(join(base,'implementation'),{recursive:true});
    await writeFile(join(base,'README.md'),`# ${type.toUpperCase()} Test — ${id}\n\n${intents[type]}\n\nThe result declares its dashboard components and MUST conform to the canonical AllasCode test-result schema.\n`);
    await writeFile(join(base,'manifest.yml'),`id: ${kind}.${id}.test.${type}\nkind: test\ntest_type: ${type}\nsubject:\n  kind: ${kind}\n  id: ${id}\n  path: ../..\nresult:\n  schema: allascode://schemas/test-result/v1\n  file: ./result.json\npresentation:\n  source: result.json#presentation.components\nimplementation: ./implementation/index.js\n`);
    await writeFile(join(base,'config.yml'),`enabled: true\ntest_type: ${type}\nsubject: ${id}\n${cfg(type)}\nthresholds:\n  fail_on_error: true\n`);
    await writeFile(join(base,'implementation','index.js'),`export async function run(context = {}) { return { semanticTest: '${type}', subject: '${id}', context }; }\n`);
    await writeFile(join(base,'index.html'),detailHtml());
    await writeFile(join(base,'schema.jsin'),'{"$schema":"https://json-schema.org/draft/2020-12/schema","$ref":"https://allascode.dev/schemas/test-result/v1.json"}\n');
    await writeFile(join(base,'result.json'),JSON.stringify(result(kind,id,artifactPath,type),null,2)+'\n');
  }
}
console.log('Semantic test anatomy materialized.');
