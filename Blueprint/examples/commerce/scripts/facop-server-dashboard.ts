import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FacopEvidencePassport } from '../runtime/facop.js';

type Metric = { id?: string; value?: number; unit?: string; label?: string };
type BaselineMetric = { subject: string; category: string; metric_id: string; unit?: string; mean: number; p50?: number; p95?: number; sample_count?: number; direction?: 'higher-better' | 'lower-better' };
type Baseline = { profile_id: string; sample_count: number; generated_at?: string; metrics: BaselineMetric[] };

const root = join(import.meta.dirname, '..');
const serverDir = join(root, '.facop', 'server');
const passport = JSON.parse(await readFile(join(root, '.facop', 'evidence', 'passport.json'), 'utf8')) as FacopEvidencePassport;
const fingerprint = JSON.parse(await readFile(join(serverDir, 'fingerprint.json'), 'utf8')) as Record<string, unknown>;
const profile = JSON.parse(await readFile(join(serverDir, 'profile.json'), 'utf8')) as { id: string };

function direction(id: string): 'higher-better' | 'lower-better' {
  return /latency|p95|p99|mean_ms|duration|recovery|error|finding|vulnerab/i.test(id) ? 'lower-better' : 'higher-better';
}

const localMetrics: Array<{ subject: string; category: string; metric_id: string; value: number; unit?: string; direction: 'higher-better' | 'lower-better' }> = [];
for (const action of passport.actions) {
  for (const [category, evidence] of Object.entries(action.categories)) {
    for (const raw of (evidence?.metrics ?? []) as Metric[]) {
      if (!raw?.id || typeof raw.value !== 'number' || Number.isNaN(raw.value)) continue;
      localMetrics.push({ subject: action.subject, category, metric_id: raw.id, value: raw.value, ...(raw.unit ? { unit: raw.unit } : {}), direction: direction(raw.id) });
    }
  }
}

let baseline: Baseline = { profile_id: profile.id, sample_count: 0, metrics: [] };
const baselineFile = process.env.FACOP_PUBLIC_BASELINE_FILE || join(root, 'facop', 'public-baselines', `${profile.id}.json`);
try { baseline = JSON.parse(await readFile(baselineFile, 'utf8')) as Baseline; } catch {}
const byKey = new Map(baseline.metrics.map(metric => [`${metric.subject}|${metric.category}|${metric.metric_id}`, metric]));
const threshold = Number(process.env.FACOP_OPTIMIZATION_THRESHOLD_PERCENT || 5);

const comparisons = localMetrics.map(metric => {
  const publicMetric = byKey.get(`${metric.subject}|${metric.category}|${metric.metric_id}`);
  if (!publicMetric || !Number.isFinite(publicMetric.mean) || publicMetric.mean === 0) return { ...metric, status: 'no-public-baseline' as const };
  const rawDelta = ((metric.value - publicMetric.mean) / Math.abs(publicMetric.mean)) * 100;
  const improvement = metric.direction === 'higher-better' ? rawDelta : -rawDelta;
  return {
    ...metric,
    public_mean: publicMetric.mean,
    public_sample_count: publicMetric.sample_count ?? baseline.sample_count,
    improvement_percent: Number(improvement.toFixed(3)),
    status: improvement >= threshold ? 'better' as const : improvement <= -threshold ? 'worse' as const : 'within-band' as const,
  };
});

const better = comparisons.filter(item => item.status === 'better');
const worse = comparisons.filter(item => item.status === 'worse');
const report = {
  generated_at: new Date().toISOString(),
  profile_id: profile.id,
  public_sample_count: baseline.sample_count,
  threshold_percent: threshold,
  fingerprint,
  summary: { metrics: comparisons.length, better: better.length, worse: worse.length, within_band: comparisons.filter(item => item.status === 'within-band').length, without_baseline: comparisons.filter(item => item.status === 'no-public-baseline').length },
  comparisons,
  rupture_points: worse,
  optimization_candidates: better,
};

const publicSample = {
  schema: 'allascode://facop/public-vps-sample/v1',
  generated_at: new Date().toISOString(),
  profile_id: profile.id,
  environment: {
    cpu_cores: fingerprint.cpu_cores,
    cpu_model_hash: fingerprint.cpu_model_hash,
    memory_mb: fingerprint.memory_mb,
    arch: fingerprint.arch,
    platform: fingerprint.platform,
    kernel: fingerprint.kernel,
    node: fingerprint.node,
    containerized: fingerprint.containerized,
  },
  metrics: localMetrics,
};

const prompt = `# FACoP Optimization Discovery Prompt\n\nYou are analyzing an AllasCode server that outperformed the public baseline for the same VPS profile.\n\nProfile: ${profile.id}\nPublic samples: ${baseline.sample_count}\n\nPositive outliers:\n${better.map(item => `- ${item.subject} / ${item.category} / ${item.metric_id}: ${item.value}${item.unit ?? ''} vs public mean ${'public_mean' in item ? item.public_mean : '?'} (${ 'improvement_percent' in item ? item.improvement_percent : 0}% better)`).join('\n') || '- none'}\n\nInspect the repository, runtime fingerprint, kernel/runtime configuration, dependency versions, process flags, scheduling/container limits and implementation details. Infer which differences are plausible causes of the positive outliers. Do not confuse correlation with causation. Propose reproducible experiments that isolate each hypothesis. For every proposed optimization, identify the exact artifact/config affected, expected metric, rollback condition and regression test. Never weaken correctness, security, durability or semantic acceptance gates to obtain a benchmark win.\n`;

const htmlData = JSON.stringify(report).replaceAll('<', '\\u003c');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FACoP Server Qualification</title><style>body{font-family:system-ui;background:#0b1020;color:#e7ecf5;margin:0;padding:24px}main{max-width:1200px;margin:auto}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.card{background:#151c31;border:1px solid #29334f;border-radius:14px;padding:16px}.good{color:#67e8a5}.bad{color:#fb7185}.muted{color:#94a3b8}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;padding:9px;border-bottom:1px solid #29334f;font-size:13px}</style></head><body><main><h1>FACoP Server Qualification</h1><p class="muted">Profile <b>${profile.id}</b> · public samples ${baseline.sample_count}</p><section class="grid"><div class="card"><b>${comparisons.length}</b><div class="muted">metrics</div></div><div class="card"><b class="good">${better.length}</b><div class="muted">better than baseline</div></div><div class="card"><b class="bad">${worse.length}</b><div class="muted">possible rupture/regression</div></div><div class="card"><b>${report.summary.without_baseline}</b><div class="muted">without public baseline</div></div></section><table><thead><tr><th>Subject</th><th>Category</th><th>Metric</th><th>Local</th><th>Public mean</th><th>Signal</th></tr></thead><tbody id="rows"></tbody></table></main><script>const d=${htmlData};document.querySelector('#rows').innerHTML=d.comparisons.map(x=>'<tr><td>'+x.subject+'</td><td>'+x.category+'</td><td>'+x.metric_id+'</td><td>'+x.value+(x.unit||'')+'</td><td>'+(x.public_mean??'—')+'</td><td class="'+(x.status==='better'?'good':x.status==='worse'?'bad':'')+'">'+x.status+(x.improvement_percent!==undefined?' ('+x.improvement_percent+'%)':'')+'</td></tr>').join('')</script></body></html>`;

await mkdir(join(root, 'tests', 'dashboard', 'facop-server'), { recursive: true });
await writeFile(join(serverDir, 'comparison.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(serverDir, 'public-sample.json'), `${JSON.stringify(publicSample, null, 2)}\n`);
await writeFile(join(serverDir, 'optimization-prompt.md'), prompt);
await writeFile(join(root, 'tests', 'dashboard', 'facop-server', 'data.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(root, 'tests', 'dashboard', 'facop-server', 'index.html'), html);
await writeFile(join(root, 'tests', 'dashboard', 'facop-server', 'summary.md'), `# FACoP server qualification\n\n- Profile: ${profile.id}\n- Public sample count: ${baseline.sample_count}\n- Metrics: ${comparisons.length}\n- Better: ${better.length}\n- Possible rupture/regression: ${worse.length}\n- Without baseline: ${report.summary.without_baseline}\n`);
console.log(`FACoP dashboard: profile=${profile.id} better=${better.length} worse=${worse.length} baseline=${baseline.sample_count}.`);
