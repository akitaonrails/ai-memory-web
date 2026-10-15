// Labels reference the existing images catalog; "=" denotes an untranslated technical identifier.
// Stages are sequential. Nodes within a stage are parallel, never implied to follow each other.
import type { CircuitKind } from '@/components/CircuitIcon.astro';
export interface DiagramNode { label: string; icon: CircuitKind; note?: string; optional?: boolean }
export interface DiagramLane { title?: string; stages: DiagramNode[][]; note?: string; connector?: 'forward' | 'both' | 'none'; optional?: boolean }
export interface DiagramSpec { lanes: DiagramLane[]; note?: string }
const n = (label: string, icon: CircuitKind = 'file', note?: string, optional = false): DiagramNode => ({ label, icon, note, optional });
const lane = (stages: (DiagramNode | DiagramNode[])[], extra: Omit<DiagramLane, 'stages'> = {}): DiagramLane =>
  ({ stages: stages.map(s => Array.isArray(s) ? s : [s]), ...extra });
const flow = (...nodes: DiagramNode[]): DiagramSpec => ({ lanes: [lane(nodes)] });

export const diagrams: Record<string, DiagramSpec> = {
  'how-it-works': { ...flow(n('Capture','terminal'), n('Consolidate','chip'), n('Recall','search'), n('Hand off','terminal')), note: 'A git-backed wiki of plain markdown files' },
  'install-solo-path': flow(n('Install','file'),n('Start the server','server','=127.0.0.1:49374'),n('Run your agent','terminal','=hooks / MCP')),
  'individuals-handoff': { lanes: [lane([n('=Claude Code','terminal'), n('=ai-memory','chip','Handoff'), n('=Codex','terminal','Claimed once')]), lane([n('Summary'),n('Next steps'),n('Open questions')],{connector:'none'})] },
  'individuals-markdown': { lanes:[lane([n('wiki/ plain markdown','folder'),[n('=grep','search'),n('=Obsidian','file'),n('Edit','file'),n('=rsync','folder')]],{connector:'both'})],note:'git history' },
  'individuals-machines': { lanes:[lane([n('=PC','terminal'),n('One ai-memory server','server')],{connector:'both'}),lane([n('Notebook','terminal','Offline'),n('Local spool','file'),n('One ai-memory server','server')],{note:'Drains later'})] },
  'integrations-hub': { lanes:[lane([[n('=Claude Code','terminal'),n('=Codex','terminal'),n('=Cursor','terminal')],n('One memory','chip'),[n('=Gemini CLI','terminal'),n('=OpenCode','terminal'),n('=Zed','terminal')]],{connector:'both'})] },
  'integrations-hooks-vs-mcp': { lanes:[lane([n('Your agent','terminal'),n('Memory','chip')],{title:'Hooks',note:'Automatic capture'}),lane([n('Your agent','terminal'),n('Memory','chip')],{title:'=MCP',note:'Tools the agent calls',connector:'both'})] },
  'architecture-pipeline': { lanes:[lane([n('Hook','terminal'),n('Sanitize','shield'),n('Single writer','chip'),n('Observations','server')]),lane([n('Observations','server'),n('Session page'),n('Optional LLM','chip',undefined,true),n('Git wiki','folder')]),lane([n('Git wiki','folder'),n('Hook','terminal')],{title:'Briefing'})] },
  'architecture-layers': { lanes:[lane([n('Writer','chip'),[n('Markdown in git','folder','Source of truth'),n('SQLite index','server','Derived')]]),lane([n('Markdown in git','folder'),[n('File watcher','search'),n('Reindex','branch')],n('SQLite index','server')])] },
  'architecture-retrieval': { lanes:[lane([n('Query','search'),[n('=FTS5','file'),n('Entities','folder'),n('Graph','branch'),n('Observations','file'),n('Vectors','server',undefined,true)],n('=RRF k=60','chip'),n('Authority','shield'),n('Results','file')])] },
  'advanced-backup-flow': { lanes:[lane([n('Running server','server'),n('=tar.gz','folder')],{title:'Backup'}),lane([n('=tar.gz','folder'),n('Server stopped','server'),n('Running server','server')],{title:'Restore'})] },
  'advanced-tls-proxy': { lanes:[lane([n('=HTTPS','shield'),n('Reverse proxy','shield','Same host'),n('=HTTP','branch'),n('=ai-memory','server','Same host')])] },
  'advanced-topologies': { lanes:[lane([n('Laptop only','terminal'),n('Homelab box','server'),n('LAN with TLS','shield'),n('Tunnel','cloud')],{connector:'none'})] },
  'compare-stack': { lanes:[lane([[n('=LLM API','cloud'),n('Vector store','server'),n('Graph database','branch'),n('Python service','terminal')]],{title:'Typical memory stack'}),lane([n('One binary','chip'),n('Markdown folder','folder')],{title:'=ai-memory'})] },
  'compare-side-by-side': { lanes:[lane([[n('Git history','branch'),n('README and docs','file')],n('=bootstrap','terminal'),n('=ai-memory','folder')]),lane([n('Your agent','terminal'),[n('=ai-memory','chip'),n('Current memory tool','server')]],{connector:'both'})] },
  'contribute-crates': { lanes:[lane([n('=cli','chip')],{connector:'none'}),lane([[n('=hooks','terminal'),n('=mcp','terminal'),n('=web','terminal'),n('=consolidate','file'),n('=workstream','branch')]],{connector:'none'}),lane([[n('=store','server'),n('=wiki','folder'),n('=llm','chip')]],{connector:'none'}),lane([n('=core','chip')],{connector:'none'})] },
  'contribute-flow': flow(n('Issue','file'),n('Branch','branch'),n('Local gates','shield'),n('Pull request','branch'),n('Review','search'),n('Next release','folder')),
  'contribute-quality-loop': { lanes:[lane([n('A mistake','terminal'),n('A written rule','file'),n('A test that breaks it','shield'),n('A gate on every pull request','branch')]),lane([n('A gate on every pull request','branch'),n('A mistake','terminal')],{note:'A person decides'})] },
  'features-launcher': { lanes:[lane([n('ai-memory run','terminal'),[n('Sandbox offer','shield'),n('Self-upgrade','folder'),n('Closes on exit','file'),n('Web sign-in','key')]])] },
  'features-messaging': { lanes:[lane([n('Project A','terminal','send'),n('Inbox, claimed once','chip'),n('Project B','terminal','pop')]),lane([n('API spec','file'),n('Untrusted input','shield')],{connector:'none'})],note:'No shared context' },
  'features-scopes': { lanes:[lane([[n('=client-a','folder'),n('=client-b','folder'),n('=personal','folder')],n('Workspaces','server','=.ai-memory.toml'),n('Mono-repo','folder')]),lane([n('Rules','file'),n('Expires Friday','clock'),n('Feedback','file')],{connector:'none'})] },
  'profile-two-axes': { lanes:[lane([n('Claude Code','terminal'),n('=ai-memory','chip'),[n('Codex','terminal'),n('OpenCode','terminal')]],{title:'Same project, any agent',connector:'both'}),lane([[n('Project A','folder'),n('Project B','folder'),n('Project C','folder')],n('Profile','chip'),n('New project','folder')])] },
  'profile-learning': { lanes:[lane([n('Your words','terminal'),n('Seen in 2 projects','folder'),n('One entry','file'),n('Every session start','terminal')]),lane([n('Your words','terminal'),n('Not yet','folder',undefined,true)],{optional:true})] },
  'research-lineage': { lanes:[lane([[n('=Karpathy wiki','file'),n('=agentmemory','file'),n('=basic-memory','file'),n('=cognee','file'),n('=Hermes Agent','file'),n('=A-MEM','file'),n('=Hindsight','file')],n('=ai-memory','chip')])] },
  'research-okf-bundle': { lanes:[lane([n('One project','folder','=index.md'),[n('Decision'),n('Gotcha'),n('Procedure')],[n('=Obsidian','file'),n('=grep','terminal'),n('Another OKF tool','folder')]])] },
  'research-three-layers': { lanes:[lane([n('Raw sources','file'),n('Hook observations','terminal')]),lane([n('Wiki','folder'),n('Markdown in git','folder')]),lane([n('Schema','file'),n('AGENTS.md block','file')])] },
  'security-boundary': flow(n('Hook payload','terminal'),n('=sanitize()','shield','Secrets dropped'),n('Stored','server','Size capped')),
  'security-egress': { lanes:[lane([n('Hooks','terminal'),n('Wiki and index','folder'),n('Local embedder','chip')],{title:'Your machine'}),lane([n('Wiki and index','folder'),[n('Cloud embeddings','cloud'),n('Cloud LLM','cloud'),n('LLM rerank','cloud')]],{title:'Third parties',note:'Opt-in, off by default',optional:true})] },
  'teams-first-day': { ...flow(n('Get an API key','key'),n('Point at the server','terminal'),n('Catch me up','terminal'),n('Search the wiki','search')), note:'Day one' },
  'teams-shared-owned': { lanes:[lane([[n('','terminal'),n('','terminal'),n('','terminal')],n('','folder')],{title:'Knowledge is shared',connector:'both'}),lane([n('','terminal'),n('','key'),n('','terminal')],{title:'Batons are owned'})] },
  'teams-topology': { lanes:[lane([[n('=Claude Code','terminal'),n('=Codex','terminal'),n('=Cursor','terminal'),n('=Gemini CLI','terminal')],n('One ai-memory server','server'),n('Project wiki','folder')],{connector:'both'})] },
  'install-team-topology': { lanes:[lane([[n('=alice','terminal'),n('=bob','terminal'),n('=carol','terminal')],n('One shared server','server','Token'),n('One wiki for the team','folder')],{connector:'both'})],note:'One API key each' },
  'aging-decay-path': { lanes:[lane([n('Page read','file','reinforces'),n('Retention score','clock'),n('Forget-sweep','search'),n('Cold?','shield')]),lane([n('Cold?','shield'),[n('Evict','file'),n('Compact','file',undefined,true),n('One survivor','file',undefined,true)]]),lane([n('git history','branch'),n('=restore-page','terminal'),[n('Evict','file'),n('Compact','file'),n('One survivor','file')]])] },
  'aging-dream-pass': { lanes:[lane([n('Opt-in','key'),n('Idle 5 min','clock'),n('Cold clusters','folder','Most novel first'),n('LLM rewrite','chip')]),lane([n('LLM rewrite','chip'),n('One merged page','file','Sources superseded')],{note:'Activity cancels'})],note:'git history' },
};
