// Source: ai-memory docs/support-matrix.md. Keep in step with the repo.
export type Status = 'Supported' | 'MCP-only' | 'Hooks-only' | 'Managed-only' | 'Community' | 'Experimental';

export const statusMeaning: Record<Status, { hue: string; means: string }> = {
  Supported: { hue: 'green', means: 'Automatic capture through lifecycle hooks, plus the memory tools over MCP.' },
  'MCP-only': { hue: 'azure', means: 'The agent can search and write memory. It exposes no lifecycle hooks, so nothing is captured automatically.' },
  'Hooks-only': { hue: 'teal', means: 'Sessions are captured automatically. The agent has no MCP client to query memory with.' },
  'Managed-only': { hue: 'violet', means: 'Works when launched through `ai-memory run`. There is no separate hook installer.' },
  Community: { hue: 'rose', means: 'A plugin maintained by the community, not installed by ai-memory itself.' },
  Experimental: { hue: 'amber', means: 'It ships and it works, with rough edges you should expect.' },
};

export interface Row { name: string; status: Status; note: string; id?: string; run?: boolean }

export const platforms: Row[] = [
  { name: 'Linux', status: 'Supported', note: 'x86_64 and ARM64. Native binary, Docker or Podman, AUR packages with systemd units.' },
  { name: 'macOS', status: 'Supported', note: 'Apple Silicon and Intel. Native binary with a launchd agent, or Docker.' },
  { name: 'Windows via WSL2', status: 'Supported', note: 'Follow the Linux path inside WSL2 and launch your agent from there.' },
  { name: 'Native Windows', status: 'Experimental', note: 'Release zip with ai-memory.exe, the Docker Desktop wrapper, or a source build.' },
];

export const harnesses: Row[] = [
  { name: 'Claude Code', id: 'claude-code', status: 'Supported', run: true, note: 'Hooks and MCP. Optional session-aware routing.' },
  { name: 'Codex', id: 'codex', status: 'Supported', run: true, note: 'Hooks and MCP. Session end is wired from Codex CLI 0.145.0.' },
  { name: 'Cursor', id: 'cursor', status: 'Supported', note: 'MCP config and lifecycle hooks.' },
  { name: 'Gemini CLI', id: 'gemini-cli', status: 'Supported', note: 'MCP config and lifecycle hooks.' },
  { name: 'OpenCode', id: 'opencode', status: 'Supported', run: true, note: 'Remote MCP and a generated TypeScript plugin.' },
  { name: 'OpenCode 2 beta', id: 'opencode2', status: 'Supported', run: true, note: 'Plugin for the beta API. Expect churn upstream.' },
  { name: 'Grok Build CLI', id: 'grok', status: 'Supported', run: true, note: 'Capture works. Handoffs are picked up through MCP.' },
  { name: 'Devin CLI', id: 'devin', status: 'Supported', note: 'Hooks and MCP, including post-compaction capture.' },
  { name: 'Kimi Code', id: 'kimi-code', status: 'Supported', run: true, note: 'Ten hook events. Handoffs inject on the first prompt.' },
  { name: 'Kiro CLI', id: 'kiro-cli', status: 'Supported', run: true, note: 'Both the v2 and v3 engines.' },
  { name: 'Command Code', id: 'command-code', status: 'Supported', run: true, note: 'MCP and four hook events, with native resume.' },
  { name: 'Antigravity CLI', id: 'antigravity-cli', status: 'Supported', run: true, note: 'Sessions close with finalize-session.' },
  { name: 'Pi', id: 'pi', status: 'Supported', run: true, note: 'A generated extension gives capture and an MCP bridge.' },
  { name: 'Oh My Pi', id: 'omp', status: 'Supported', run: true, note: 'Native MCP and a TypeScript extension.' },
  { name: 'OpenClaw', id: 'openclaw', status: 'Supported', note: 'MCP config and native plugin hooks.' },
  { name: 'Zero', id: 'zero', status: 'Supported', note: 'Capture includes subagent events.' },
  { name: 'ZCode', id: 'zcode', status: 'Supported', note: 'Six triggers. Handoff injection works.' },
  { name: 'Crush', id: 'crush', status: 'Managed-only', run: true, note: 'Launch it with ai-memory run crush.' },
  { name: 'Pool', id: 'pool', status: 'Hooks-only', note: 'Paste a generated hooks snippet into its settings.' },
  { name: 'Claude Desktop', id: 'claude-desktop', status: 'MCP-only', note: 'Connects through mcp-remote.' },
  { name: 'VS Code Copilot', id: 'vscode-copilot', status: 'MCP-only', note: 'Copilot exposes no lifecycle hooks yet.' },
  { name: 'Zed', id: 'zed', status: 'MCP-only', note: 'Registered as a context server.' },
  { name: 'Swival CLI', id: 'swival', status: 'MCP-only', note: 'Project-level MCP config.' },
  { name: 'Muse Code', id: 'muse', status: 'MCP-only', note: 'User-level MCP settings.' },
  { name: 'Hermes Agent', id: 'hermes', status: 'Community', note: 'Community plugin by MrLuciano.' },
];

export const llmProviders = ['Anthropic', 'OpenAI', 'OpenAI OAuth / Codex CLI login', 'GitHub Copilot', 'Google Gemini', 'OpenCode Go and Zen', 'Ollama', 'LM Studio', 'vLLM', 'Any OpenAI-compatible endpoint'];
export const embeddingProviders = ['Local, in-process (the default)', 'OpenAI', 'Voyage', 'Google Gemini', 'GitHub Copilot', 'Ollama, LM Studio, vLLM'];
