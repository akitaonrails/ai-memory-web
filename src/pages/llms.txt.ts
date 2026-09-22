// https://llmstxt.org: a plain-text map of the site for language models and the agents that browse for people.
import type { APIRoute } from 'astro';
import { nav, site } from '@/data/site';
import { getGithub } from '@/data/github';
import { useI18n, localizePath } from '@/i18n';
import { localeCodes, locales } from '@/i18n/config';

export const GET: APIRoute = async ({ site: origin }) => {
  const gh = await getGithub();
  const latest = gh.releases.find((r) => !r.prerelease) ?? gh.releases[0];
  const abs = (href: string) => new URL(href, origin).href;
  const { t } = useI18n({ currentLocale: 'en', params: {} });
  const body = `# ${site.name}

> Long-term memory for AI coding agents. Open source (MIT), written in Rust, by ${site.author}. Quit one coding agent mid-task, start another in the same directory, and continue without re-explaining the project.

ai-memory is a single self-contained binary that runs a small MCP/HTTP server. Lifecycle hooks in the coding agent capture prompts, tool calls and session boundaries, sanitized before storage. Sessions are consolidated into a git-backed wiki of plain markdown files, which is the source of truth; SQLite holds a derived, rebuildable index (FTS5, entities, links, optional vectors). Capture, search and handoffs work with zero LLM calls and no API key. One server can be shared by several machines and by a team. The wiki is natively an Open Knowledge Format (OKF v0.2) bundle. Latest release: ${latest.tag}.

${nav.map((g) => `## ${t(`nav.${g.id}.label`)}\n\n${g.links.map((l) => `- [${t(`nav.${g.id}.${l.id}.label`)}](${abs(l.href)}): ${t(`nav.${g.id}.${l.id}.note`)}`).join('\n')}`).join('\n\n')}

## Languages

${localeCodes.map((l) => `- [${locales[l].label}](${abs(localizePath(l, '/'))})`).join('\n')}

## Source and documentation

- [GitHub repository](${site.repo}): source, issues, pull requests
- [README](${site.repo}#readme): overview and quick start
- [Installation cookbook](${site.docs}/install.md): every agent and platform
- [Architecture](${site.docs}/ARCHITECTURE.md): data flow, crates, invariants, schema
- [How ai-memory compares](${site.docs}/comparison.md): a fair rundown against other memory tools
- [Benchmarks](${site.docs}/benchmarks/README.md): published LongMemEval-S retrieval numbers, reproducible
- [Security model](${site.docs}/security.md) and [data handling](${site.repo}/blob/main/DATA_HANDLING.md)
- [Changelog](${abs('/download/#changelog')}) and [releases](${site.repo}/releases)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
