export const site = {
  name: 'ai-memory',
  domain: 'aimemory.io',
  tagline: 'Long-term memory for AI coding agents',
  repo: 'https://github.com/akitaonrails/ai-memory',
  repoSlug: 'akitaonrails/ai-memory',
  docs: 'https://github.com/akitaonrails/ai-memory/blob/main/docs',
  docker: 'https://hub.docker.com/r/akitaonrails/ai-memory',
  author: 'Fabio Akita',
  authorUrl: 'https://akitaonrails.com',
};

export type Hue = 'green' | 'teal' | 'azure' | 'violet' | 'rose' | 'amber';
export interface NavLink { label: string; href: string; note: string; hue: Hue }
export interface NavGroup { label: string; links: NavLink[] }

// One hue per subject, used everywhere that subject appears (nav, cards, page headers, diagrams):
// agents = violet, machines = azure, teams = teal, the wiki = green, security = rose, action/handoff = amber.
export const nav: NavGroup[] = [
  {
    label: 'Product',
    links: [
      { label: 'How it works', href: '/#how', note: 'Capture, consolidate, recall, hand off', hue: 'green' },
      { label: 'Architecture', href: '/architecture/', note: 'One binary, markdown files, a derived index', hue: 'azure' },
      { label: 'Security', href: '/security/', note: 'What is stored, what leaves, how to lock it down', hue: 'rose' },
      { label: 'Research and rationale', href: '/research/', note: 'Karpathy’s wiki, OKF, and the benchmarks', hue: 'violet' },
    ],
  },
  {
    label: 'Solutions',
    links: [
      { label: 'For individuals', href: '/solutions/individuals/', note: 'Switch agents and machines, keep the context', hue: 'violet' },
      { label: 'For teams', href: '/solutions/teams/', note: 'One shared memory, faster onboarding', hue: 'teal' },
      { label: 'Migrating from another tool', href: '/compare/', note: 'Mem0, Zep, cognee, OpenViking and others', hue: 'amber' },
    ],
  },
  {
    label: 'Integrations',
    links: [
      { label: 'Agents and editors', href: '/integrations/#agents', note: 'Claude Code, Codex, Cursor, Gemini CLI and 20 more', hue: 'violet' },
      { label: 'Operating systems', href: '/integrations/#platforms', note: 'Linux, macOS, Windows', hue: 'azure' },
      { label: 'LLM and embedding providers', href: '/integrations/#providers', note: 'Optional. Everything works without one', hue: 'green' },
    ],
  },
  {
    label: 'Developers',
    links: [
      { label: 'Quick setup', href: '/install/', note: 'Solo in three commands, a team in ten minutes', hue: 'amber' },
      { label: 'Advanced setup', href: '/advanced/', note: 'Homelab, TLS, SSO, air-gapped, backups', hue: 'azure' },
      { label: 'Contribute', href: '/contribute/', note: 'Where issues, PRs and new harnesses go', hue: 'teal' },
      { label: 'Downloads and changelog', href: '/download/', note: 'Latest release for every platform', hue: 'green' },
    ],
  },
];
