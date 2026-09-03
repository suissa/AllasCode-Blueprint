import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const outDir = join(root, '.facop', 'security');
await mkdir(outDir, { recursive: true });

type PackageLock = { packages?: Record<string, { name?: string; version?: string }> };
type OsvBatch = { results?: Array<{ vulns?: Array<{ id: string; modified?: string }> }> };
type OsvVuln = { id: string; aliases?: string[]; summary?: string; details?: string; modified?: string; published?: string; severity?: Array<{ type: string; score: string }>; database_specific?: Record<string, unknown> };
type Kev = { vulnerabilities?: Array<{ cveID?: string; vendorProject?: string; product?: string; vulnerabilityName?: string; dateAdded?: string; shortDescription?: string; requiredAction?: string }> };
type GithubAdvisory = { ghsa_id?: string; cve_id?: string; severity?: string; summary?: string; description?: string; published_at?: string; updated_at?: string; vulnerabilities?: Array<{ package?: { ecosystem?: string; name?: string }; vulnerable_version_range?: string; first_patched_version?: string | null }> };

const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8')) as PackageLock;
const packages = Object.entries(lock.packages ?? {})
  .filter(([path, pkg]) => path.startsWith('node_modules/') && pkg.name && pkg.version)
  .map(([, pkg]) => ({ name: pkg.name!, version: pkg.version! }))
  .filter((value, index, all) => all.findIndex(candidate => candidate.name === value.name && candidate.version === value.version) === index)
  .sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return await response.json() as T;
}

const batch = await jsonFetch<OsvBatch>('https://api.osv.dev/v1/querybatch', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ queries: packages.map(pkg => ({ package: { ecosystem: 'npm', name: pkg.name }, version: pkg.version })) }),
});

const packageVulns = new Map<string, Set<string>>();
for (let index = 0; index < packages.length; index++) {
  const pkg = packages[index]!;
  const ids = new Set((batch.results?.[index]?.vulns ?? []).map(item => item.id));
  packageVulns.set(`${pkg.name}@${pkg.version}`, ids);
}
const ids = [...new Set([...packageVulns.values()].flatMap(set => [...set]))].sort();
const details = new Map<string, OsvVuln>();
for (const id of ids) {
  try { details.set(id, await jsonFetch<OsvVuln>(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`)); }
  catch (error) { console.warn(`OSV detail unavailable for ${id}: ${String(error)}`); }
}

const kevUrl = process.env.FACOP_CISA_KEV_URL || 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
let kev: Kev = { vulnerabilities: [] };
try { kev = await jsonFetch<Kev>(kevUrl); } catch (error) { console.warn(`CISA KEV unavailable: ${String(error)}`); }
const kevByCve = new Map((kev.vulnerabilities ?? []).filter(item => item.cveID).map(item => [item.cveID!, item]));

const ghHeaders: Record<string, string> = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'allascode-facop-security-watch' };
if (process.env.GITHUB_TOKEN) ghHeaders.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const githubByPackage = new Map<string, GithubAdvisory[]>();
for (const pkg of packages) {
  try {
    const affects = encodeURIComponent(`${pkg.name}@${pkg.version}`);
    githubByPackage.set(`${pkg.name}@${pkg.version}`, await jsonFetch<GithubAdvisory[]>(`https://api.github.com/advisories?ecosystem=npm&affects=${affects}&per_page=100`, { headers: ghHeaders }));
  } catch (error) { console.warn(`GitHub advisory query unavailable for ${pkg.name}: ${String(error)}`); }
}

const findings = packages.flatMap(pkg => {
  const key = `${pkg.name}@${pkg.version}`;
  const osv = [...(packageVulns.get(key) ?? [])].map(id => details.get(id) ?? ({ id } as OsvVuln));
  const github = githubByPackage.get(key) ?? [];
  const mergedIds = new Set<string>();
  for (const vuln of osv) { mergedIds.add(vuln.id); for (const alias of vuln.aliases ?? []) mergedIds.add(alias); }
  for (const advisory of github) { if (advisory.ghsa_id) mergedIds.add(advisory.ghsa_id); if (advisory.cve_id) mergedIds.add(advisory.cve_id); }
  if (!mergedIds.size) return [];
  const exploited = [...mergedIds].map(id => kevByCve.get(id)).filter(Boolean);
  const severity = github.map(item => item.severity).find(Boolean) ?? 'unknown';
  return [{ package: pkg, ids: [...mergedIds].sort(), severity, known_exploited: exploited.length > 0, kev: exploited, osv, github }];
});

let seen: { ids?: string[] } = {};
try { seen = JSON.parse(await readFile(join(outDir, 'seen.json'), 'utf8')) as { ids?: string[] }; } catch {}
const seenIds = new Set(seen.ids ?? []);
const currentIds = [...new Set(findings.flatMap(item => item.ids))].sort();
const newIds = currentIds.filter(id => !seenIds.has(id));
const prioritized = findings.slice().sort((a, b) => Number(b.known_exploited) - Number(a.known_exploited) || String(a.severity).localeCompare(String(b.severity)));

const intelligence = {
  schema: 'allascode://facop/security-intelligence/v1',
  generated_at: new Date().toISOString(),
  sources: ['OSV', 'GitHub Advisory Database', 'CISA KEV'],
  installed_packages: packages.length,
  finding_count: findings.length,
  new_advisory_ids: newIds,
  findings: prioritized,
};
await writeFile(join(outDir, 'intelligence.json'), `${JSON.stringify(intelligence, null, 2)}\n`);
await writeFile(join(outDir, 'seen.json'), `${JSON.stringify({ updated_at: new Date().toISOString(), ids: currentIds }, null, 2)}\n`);

const prompt = `# FACoP Autonomous Security Remediation Prompt\n\nNew correlated security advisories: ${newIds.length}\nAffected installed dependency groups: ${findings.length}\n\n${prioritized.map(item => `## ${item.package.name}@${item.package.version}\n- IDs: ${item.ids.join(', ')}\n- Severity: ${item.severity}\n- Known exploited in CISA KEV: ${item.known_exploited ? 'YES' : 'no'}\n`).join('\n')}\nYou are the local AllasCode security remediation agent. Analyze only advisories correlated with the exact dependency/runtime surface recorded in intelligence.json. For every applicable advisory: (1) identify the vulnerable path and exploit precondition; (2) create the smallest safe patch or dependency upgrade; (3) create a regression/security test that FAILS against the vulnerable baseline and PASSES with the patch; (4) preserve public API and semantic invariants unless the vulnerability requires an explicit contract change; (5) do not disable tests, reduce security checks, pin to a known-vulnerable version, suppress audit output or mark a required security predicate not-applicable; (6) run project-owned stage acceptance and server qualification; (7) if the patch changes performance, include the before/after server-profile metrics. Treat CISA KEV correlation as highest priority. If an advisory is not applicable, produce machine-verifiable evidence explaining why.\n`;
await writeFile(join(outDir, 'remediation-prompt.md'), prompt);
console.log(`FACoP security intelligence: packages=${packages.length} findings=${findings.length} new_ids=${newIds.length}.`);
if (findings.some(item => item.known_exploited)) console.warn('FACoP SECURITY: a correlated dependency appears in CISA KEV and requires immediate qualification.');
