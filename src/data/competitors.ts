// Which tools the site compares against. All text lives in src/i18n/locales/<locale>/competitors.json:
//   items.<id>.{name, kind, needs[], same, gain[], theyWin, verdict}   and   moat[].{title, text}
// Source for the claims: ai-memory docs/comparison.md and docs/competitive-parity.md (September 2026).
// Every "theyWin" line is from the project's own audit. Vendor numbers are labelled as vendor numbers.
export interface CompetitorText { name: string; kind: string; needs: string[]; same: string; gain: string[]; theyWin: string; verdict: string }
export interface MoatText { title: string; text: string }

export const competitors = [
  { id: 'claude-memory', featured: true },
  { id: 'mem0', featured: true },
  { id: 'zep', featured: true },
  { id: 'cognee', featured: true },
  { id: 'openviking', featured: true },
  { id: 'basic-memory', featured: false },
  { id: 'mcp-memory-service', featured: false },
  { id: 'agentmemory', featured: false },
  { id: 'letta', featured: false },
  { id: 'supermemory', featured: false },
] as const;
