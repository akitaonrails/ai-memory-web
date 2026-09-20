export const site = {
  name: 'ai-memory',
  domain: 'aimemory.io',
  repo: 'https://github.com/akitaonrails/ai-memory',
  repoSlug: 'akitaonrails/ai-memory',
  docs: 'https://github.com/akitaonrails/ai-memory/blob/main/docs',
  docker: 'https://hub.docker.com/r/akitaonrails/ai-memory',
  author: 'Fabio Akita',
  authorUrl: 'https://akitaonrails.com',
};

export type Hue = 'green' | 'teal' | 'azure' | 'violet' | 'rose' | 'amber';
export interface NavLink { id: string; href: string; hue: Hue }
export interface NavGroup { id: string; links: NavLink[] }

// Labels and notes live in src/i18n/locales/<locale>/common.json under nav.<group>.<link>.
// One hue per subject, used everywhere that subject appears (nav, cards, page headers, diagrams):
// agents = violet, machines = azure, teams = teal, the wiki = green, security = rose, action/handoff = amber.
export const nav: NavGroup[] = [
  {
    id: 'product',
    links: [
      { id: 'how', href: '/#how', hue: 'green' },
      { id: 'aging', href: '/aging/', hue: 'teal' },
      { id: 'architecture', href: '/architecture/', hue: 'azure' },
      { id: 'security', href: '/security/', hue: 'rose' },
      { id: 'research', href: '/research/', hue: 'violet' },
    ],
  },
  {
    id: 'solutions',
    links: [
      { id: 'individuals', href: '/solutions/individuals/', hue: 'violet' },
      { id: 'teams', href: '/solutions/teams/', hue: 'teal' },
      { id: 'compare', href: '/compare/', hue: 'amber' },
    ],
  },
  {
    id: 'integrations',
    links: [
      { id: 'agents', href: '/integrations/#agents', hue: 'violet' },
      { id: 'platforms', href: '/integrations/#platforms', hue: 'azure' },
      { id: 'providers', href: '/integrations/#providers', hue: 'green' },
    ],
  },
  {
    id: 'developers',
    links: [
      { id: 'install', href: '/install/', hue: 'amber' },
      { id: 'advanced', href: '/advanced/', hue: 'azure' },
      { id: 'contribute', href: '/contribute/', hue: 'teal' },
      { id: 'download', href: '/download/', hue: 'green' },
    ],
  },
];
