// Compares what the site says with the ai-memory repository, and lists what changed upstream since the site was
// last reviewed. Run it after every ai-memory release. It needs a local checkout of ai-memory.
//
//   npm run check:upstream                       compare with the newest release tag; exits 1 on a stale hard fact
//   npm run check:upstream -- --to v2.4.0        compare with a specific tag, branch or commit
//   npm run check:upstream -- --record           after the site is updated: remember the release it was reviewed against
//   AI_MEMORY_REPO=/path/to/ai-memory npm run check:upstream
//
// Everything is read from the release tag through git, never from the working tree, so unreleased work in the
// checkout (the next version's branch) cannot leak onto the site. Run `git fetch --tags` in ai-memory first.
//
// Part 1 "Changed upstream" is reading material: docs that changed and the changelog since the last review.
// Part 2 "Hard facts" is checked by the script: support matrix, benchmark, throughput, crates, commands, links.
// Part 3 "Where the numbers are quoted" tells you every sentence to touch when a number changes.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const site = new URL('..', import.meta.url).pathname;
const repo = process.env.AI_MEMORY_REPO ?? join(homedir(), 'Projects/ai-memory');
if (!existsSync(join(repo, 'Cargo.toml'))) {
  console.error(`No ai-memory checkout at ${repo}. Set AI_MEMORY_REPO.`);
  process.exit(2);
}
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const arg = (flag) => (process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : undefined);
const newestTag = git('tag', '--sort=-v:refname').split('\n').find((t) => /^v\d/.test(t));
const ref = arg('--to') ?? newestTag ?? 'HEAD';
const up = (file) => git('show', `${ref}:${file}`);
const upFiles = git('ls-tree', '-r', '--name-only', ref).split('\n');
/** Does this exact text appear in the repo's docs or Rust sources at the release? */
const upstreamHas = (text) => {
  try { git('grep', '-q', '-F', '-e', text, ref, '--', 'README.md', 'SECURITY.md', 'DATA_HANDLING.md', 'docs', 'crates', 'hooks', 'packaging'); return true; } catch { return false; }
};
const here = (file) => readFileSync(join(site, file), 'utf8');
const syncPath = join(site, 'src/data/upstream-sync.json');
const last = existsSync(syncPath) ? JSON.parse(readFileSync(syncPath, 'utf8')) : null;
const facts = JSON.parse(here('src/data/facts.json'));

const head = git('rev-parse', `${ref}^{commit}`);
const version = up('Cargo.toml').match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? 'unknown';

if (process.argv.includes('--record')) {
  writeFileSync(syncPath, JSON.stringify({ ref, commit: head, version, reviewedAt: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
  console.log(`Recorded: site reviewed against ai-memory ${ref} (${version}, ${head.slice(0, 9)}).`);
  process.exit(0);
}

let problems = 0;
const bad = (msg) => { problems++; console.log(`  MISMATCH  ${msg}`); };
const ok = (msg) => console.log(`  ok        ${msg}`);
const note = (msg) => console.log(`  note      ${msg}`);
const section = (title) => console.log(`\n${title}\n${'-'.repeat(title.length)}`);

console.log(`ai-memory at ${repo}: comparing with ${ref} (version ${version}, commit ${head.slice(0, 9)}).`);
console.log(last ? `Site last reviewed against ${last.version} (${last.commit.slice(0, 9)}) on ${last.reviewedAt}.` : 'Site has never been recorded as reviewed. Run with --record once it is up to date.');

// ---------------------------------------------------------------- 1. Changed upstream
section('1. Changed upstream since the last review');
const watched = ['README.md', 'SECURITY.md', 'DATA_HANDLING.md', 'CONTRIBUTING.md', 'Cargo.toml', 'docs', 'packaging', 'hooks'];
if (last && last.commit !== head) {
  let known = true;
  try { git('cat-file', '-e', `${last.commit}^{commit}`); } catch { known = false; }
  if (!known) note(`commit ${last.commit.slice(0, 9)} is not in this checkout; pull it, or review everything`);
  else {
    console.log(`  ${git('rev-list', '--count', `${last.commit}..${head}`)} commits.`);
    const stat = git('diff', '--stat=120', `${last.commit}..${head}`, '--', ...watched).split('\n').filter(Boolean);
    const skip = /docs\/(research-|issues-|design-|ROADMAP|prior-art)|benchmarks\/longmemeval/;
    const lines = stat.slice(0, -1).filter((l) => !skip.test(l));
    console.log(lines.length ? lines.map((l) => `  ${l.trim()}`).join('\n') : '  No watched file changed.');
    console.log(`\n  Read a change with:  git -C ${repo} diff ${last.commit.slice(0, 9)}..${ref} -- <file>`);
  }
} else if (last) console.log(`  Nothing: ${ref} is the release the site was reviewed against.`);

const changelog = up('CHANGELOG.md').split(/^## \[/m).slice(1).map((c) => ({ version: c.slice(0, c.indexOf(']')), body: c.slice(c.indexOf('\n') + 1) }));
const newer = [];
for (const entry of changelog) { if (last && entry.version === last.version) break; newer.push(entry); }
if (last && newer.length && newer.length < changelog.length) {
  console.log(`\n  Changelog entries since ${last?.version ?? 'the beginning'}:`);
  for (const e of newer.slice(0, 12)) {
    const bullets = [...e.body.matchAll(/^(### \w+)|^- (.+(?:\n {2}.+)*)/gm)].map((m) => m[1] ?? `    - ${m[2].replace(/\s+/g, ' ').slice(0, 170)}`);
    if (!bullets.length) continue;
    console.log(`\n  [${e.version}]\n${bullets.map((b) => (b.startsWith('###') ? `   ${b.slice(4)}` : b)).join('\n')}`);
  }
}

// ---------------------------------------------------------------- 2. Hard facts
section('2. Hard facts');

// Support matrix: README table vs src/data/support.ts
{
  const norm = (s) => s.toLowerCase().replace(/\(.*?\)|`/g, '').split(' / ')[0].replace(/beta|cli$/g, '').replace(/[^a-z0-9]/g, '');
  const alias = { ohmypi: 'ohmypi', pool: 'pool' };
  const upstream = new Map();
  for (const m of up('README.md').matchAll(/^\| ([^|]+?) \| (Supported|Experimental|MCP-only|Hooks-only|Managed-only|Community|Opt-in) \|$/gm)) upstream.set(norm(m[1]), { name: m[1].trim(), status: m[2] });
  const ours = [...here('src/data/support.ts').matchAll(/\{ name: '([^']+)'(?:, id: '[^']+')?, status: '([^']+)'/g)].map((m) => ({ name: m[1], status: m[2] }));
  const seen = new Set();
  for (const row of ours) {
    const key = alias[norm(row.name)] ?? norm(row.name);
    const u = upstream.get(key);
    seen.add(key);
    if (!u) bad(`support: "${row.name}" is on the site but not in the README matrix`);
    else if (u.status !== row.status) bad(`support: "${row.name}" is ${row.status} on the site, ${u.status} upstream`);
  }
  const notAgents = new Set(['managedworkstreams', 'llmauthproviders', 'embeddingproviders']);
  for (const [key, u] of upstream) if (!seen.has(key) && !notAgents.has(key)) bad(`support: "${u.name}" (${u.status}) is in the README matrix but not on the site (src/data/support.ts + support.json)`);
  if (!problems) ok(`support matrix: ${ours.length} rows match the README`);
}

// Benchmark: docs/benchmarks/README.md baseline table vs facts.json
{
  const before = problems;
  const text = up('docs/benchmarks/README.md');
  // The README lists every dated baseline. The site shows the newest run, plus the pre-2.0 figure as history.
  const rows = [...text.matchAll(/^\| \**(\d{4}-\d{2}-\d{2})\**\s*\|[^|]*\|[^|]*\| \**([\d.]+)\**\s*\|/gm)].map((m) => ({ date: m[1], hit5: Number(m[2]) }));
  const latestDate = rows.map((r) => r.date).sort().pop();
  const ours = facts.benchmark.metrics['hit@5'];
  for (const v of ours) if (!rows.some((r) => r.hit5 === v)) bad(`benchmark hit@5 ${v} is on the site but not in docs/benchmarks/README.md`);
  for (const r of rows.filter((x) => x.date === latestDate)) if (!ours.includes(r.hit5)) bad(`benchmark: newest upstream baseline (${r.date}) has hit@5 ${r.hit5}, which the site does not show`);
  if (latestDate && latestDate !== facts.benchmark.date) bad(`benchmark date: site says ${facts.benchmark.date}, newest upstream baseline is ${latestDate}`);
  const abText = upFiles.includes('docs/benchmarks/retrieval-ab-r2.md') ? up('docs/benchmarks/retrieval-ab-r2.md') : '';
  for (const v of facts.benchmark.variance?.runs ?? []) if (!abText.includes(String(v))) bad(`benchmark run ${v} is not in docs/benchmarks/retrieval-ab-r2.md`);
  for (const r of facts.benchmark.ab?.rows ?? []) for (const v of [r.fts, r.local, r.delta]) if (!abText.includes(String(v))) bad(`benchmark A/B value ${v} (${r.id}) is not in docs/benchmarks/retrieval-ab-r2.md`);
  for (const [name, values] of Object.entries(facts.benchmark.metrics)) {
    for (const v of values) if (!text.includes(String(v)) && !upFiles.filter((f) => f.startsWith('docs/benchmarks/')).some((f) => up(f).includes(String(v)))) note(`benchmark ${name} ${v} is not quoted anywhere under docs/benchmarks (check it)`);
  }
  if (before === problems) ok(`benchmark: hit@5 ${facts.benchmark.metrics['hit@5'].join(' -> ')} (${facts.benchmark.date}) matches`);
}

// Throughput: docs/deploy.md table vs facts.json
{
  const before = problems;
  const rows = [...up('docs/deploy.md').matchAll(/^\|\s*(\d+)\s*\|\s*([\d,]+)\s*\/s\s*\|\s*([\d.]+)\s*ms\s*\|/gm)].map((m) => ({ writers: Number(m[1]), rate: Number(m[2].replace(/,/g, '')), latency: Number(m[3]) }));
  for (const r of facts.throughput.rows) {
    const u = rows.find((x) => x.writers === r.writers);
    if (!u) bad(`throughput: no upstream row for ${r.writers} writers`);
    else if (u.rate !== r.rate || u.latency !== r.latency) bad(`throughput @${r.writers} writers: site ${r.rate}/s ${r.latency} ms, upstream ${u.rate}/s ${u.latency} ms`);
  }
  if (before === problems) ok(`throughput: ${facts.throughput.rows.length} rows match docs/deploy.md`);
}

// Crates: Cargo.toml workspace members vs facts.json
{
  const members = [...up('Cargo.toml').split('[workspace]')[1].split(']')[0].matchAll(/"crates\/ai-memory-([\w-]+)"/g)].map((m) => m[1]).filter((n) => !/test|eval/.test(n)).sort();
  const ours = [...facts.crates.names].sort();
  if (JSON.stringify(members) !== JSON.stringify(ours)) bad(`crates: site lists ${ours.join(', ')}; Cargo.toml has ${members.join(', ')}`);
  else ok(`crates: ${ours.length} match Cargo.toml`);
}

// Commands, flags and environment variables shown on the site must still exist upstream.
{
  const before = problems;
  const walk = (dir, out = []) => { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
  const siteText = [...walk(join(site, 'src/pages')), ...walk(join(site, 'src/components')), ...walk(join(site, 'src/i18n/locales/en'))].map((p) => readFileSync(p, 'utf8')).join('\n');
  const env = new Set(siteText.match(/\bAI_MEMORY_[A-Z0-9_]+\b/g) ?? []);
  for (const v of env) if (!upstreamHas(v) && !upstreamHas(v.replace(/^AI_MEMORY_/, '').toLowerCase())) bad(`env var ${v} is on the site but nowhere in the repo`);

  // Only text that is a command counts: a line that starts with `ai-memory` (after a prompt, a quote, a backtick,
  // a <code> tag or "./"), in a code block or inline code. Prose that mentions the project name is ignored.
  const commandLines = siteText.replace(/<style[\s\S]*?<\/style>/g, '').split(/\n|<code[^>]*>|<\/code>|`/)
    .map((l) => l.trim().replace(/^(?:[$>#]\s*|["']|\.\/)+/, '')).filter((l) => /^ai-memory\s+[a-z-]/.test(l));
  const sub = new Set(commandLines.map((l) => l.match(/^ai-memory\s+(?:--[a-z-]+\s+\S+\s+)*([a-z][a-z-]+(?: (?:add-human|add|rotate|revoke|list|disable|enable|reset-password|login))?)/)?.[1]).filter(Boolean));
  for (const s of sub) {
    const [cmd, second] = s.split(' ');
    const found = upstreamHas(`ai-memory ${cmd}`) || upstreamHas(`"${cmd}"`) || upstreamHas(cmd);
    if (!found) bad(`command "ai-memory ${cmd}" is on the site but not found upstream`);
    else if (second && !upstreamHas(`${cmd} ${second}`)) bad(`command "ai-memory ${s}" is on the site but "${cmd} ${second}" is not found upstream`);
  }
  const flags = new Set(commandLines.flatMap((l) => l.match(/(?<![\w-])--[a-z][a-z-]+\b/g) ?? []));
  for (const f of flags) if (!upstreamHas(f)) bad(`flag ${f} is on the site but not found upstream`);
  if (before === problems) ok(`commands: ${sub.size} subcommands, ${flags.size} flags and ${env.size} environment variables all exist upstream`);
}

// Links into the repository's docs must point at files that exist.
{
  const before = problems;
  const pages = execFileSync('grep', ['-rhoE', "(site\\.docs\\}?|doc\\(')[^`'\")]*\\.md", join(site, 'src/pages'), join(site, 'src/components')], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const files = new Set(pages.map((l) => l.match(/([\w./-]+\.md)$/)?.[1]).filter(Boolean).map((f) => f.replace(/^\//, '')));
  for (const f of files) if (!upFiles.includes(`docs/${f}`)) bad(`link to docs/${f}, which does not exist upstream`);
  for (const f of ['SECURITY.md', 'DATA_HANDLING.md', 'CONTRIBUTING.md', 'CHANGELOG.md']) if (!upFiles.includes(f)) bad(`link to ${f}, which does not exist upstream`);
  if (before === problems) ok(`links: ${files.size} linked docs exist upstream`);
}

// Release assets named on the download page must exist in the newest published release (from the GitHub snapshot).
{
  const before = problems;
  const snap = JSON.parse(here('src/data/github-snapshot.json'));
  const assets = new Set((snap.releases.find((r) => !r.prerelease) ?? snap.releases[0]).assets.map((a) => a.name));
  const named = new Set(here('src/pages/[...locale]/download.astro').match(/ai-memory-[a-z0-9_-]+\.(?:tar\.gz|zip)/g) ?? []);
  for (const n of named) if (!assets.has(n)) bad(`download page offers ${n}, which is not in release ${snap.releases[0].tag} (snapshot of ${snap.fetchedAt.slice(0, 10)}; refresh with npm run snapshot:github)`);
  if (before === problems) ok(`downloads: ${named.size} asset names exist in ${snap.releases[0].tag}`);
}

// ---------------------------------------------------------------- 3. Where numbers are quoted in prose
section('3. Where the numbers are quoted (English catalogs; the other five languages use the same keys)');
{
  const tracked = [
    ...Object.values(facts.benchmark.metrics).flat(), ...Object.values(facts.benchmark.vendorReported),
    facts.benchmark.questionsScored, 700, 1024, '87 MB', '2 KB', '16 KiB', '200 ms',
  ].map(String);
  const flat = (node, prefix, out) => {
    if (typeof node === 'string') out.push([prefix, node]);
    else for (const [k, v] of Object.entries(node)) flat(v, prefix ? `${prefix}.${k}` : k, out);
    return out;
  };
  const dir = join(site, 'src/i18n/locales/en');
  const strings = readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => flat(JSON.parse(readFileSync(join(dir, f), 'utf8')), '', []).map(([k, v]) => [`${f.replace('.json', '')}:${k}`, v]));
  for (const n of [...new Set(tracked)]) {
    const re = new RegExp(`(?<![\\d.])${n.replace('.', '\\.')}(?![\\d])`);
    const keys = strings.filter(([, v]) => re.test(v.replace(/,/g, ''))).map(([k]) => k);
    if (keys.length) console.log(`  ${n.padEnd(7)} ${keys.join(', ')}`);
  }
}

console.log(problems ? `\n${problems} mismatch(es). Update the site (docs/release-sync.md), then run with --record.` : '\nNo mismatches. Review part 1, update what it affects, then run with --record.');
process.exit(problems ? 1 : 0);
