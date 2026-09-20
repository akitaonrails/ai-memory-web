// Source: ai-memory docs/support-matrix.md. Keep in step with the repo.
export type Status = 'Supported' | 'MCP-only' | 'Hooks-only' | 'Managed-only' | 'Community' | 'Experimental';

// Text lives in src/i18n/locales/<locale>/support.json:
//   status.<slug>.{label, means}, platforms.<slug>.{name, note}, harnesses.<id>.note, llmProviders[], embeddingProviders[]
export const statusHue: Record<Status, string> = {
  Supported: 'green', 'MCP-only': 'azure', 'Hooks-only': 'teal', 'Managed-only': 'violet', Community: 'rose', Experimental: 'amber',
};
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface Row { name: string; status: Status; id?: string; run?: boolean }

export const platforms: Row[] = [
  { name: 'Linux', status: 'Supported' },
  { name: 'macOS', status: 'Supported' },
  { name: 'Windows via WSL2', status: 'Supported' },
  { name: 'Native Windows', status: 'Experimental' },
];

export const harnesses: Row[] = [
  { name: 'Claude Code', id: 'claude-code', status: 'Supported', run: true },
  { name: 'Codex', id: 'codex', status: 'Supported', run: true },
  { name: 'Cursor', id: 'cursor', status: 'Supported' },
  { name: 'Gemini CLI', id: 'gemini-cli', status: 'Supported' },
  { name: 'OpenCode', id: 'opencode', status: 'Supported', run: true },
  { name: 'OpenCode 2 beta', id: 'opencode2', status: 'Supported', run: true },
  { name: 'Grok Build CLI', id: 'grok', status: 'Supported', run: true },
  { name: 'Devin CLI', id: 'devin', status: 'Supported' },
  { name: 'Kimi Code', id: 'kimi-code', status: 'Supported', run: true },
  { name: 'Kiro CLI', id: 'kiro-cli', status: 'Supported', run: true },
  { name: 'Command Code', id: 'command-code', status: 'Supported', run: true },
  { name: 'Antigravity CLI', id: 'antigravity-cli', status: 'Supported', run: true },
  { name: 'Pi', id: 'pi', status: 'Supported', run: true },
  { name: 'Oh My Pi', id: 'omp', status: 'Supported', run: true },
  { name: 'OpenClaw', id: 'openclaw', status: 'Supported' },
  { name: 'Zero', id: 'zero', status: 'Supported' },
  { name: 'ZCode', id: 'zcode', status: 'Supported' },
  { name: 'Crush', id: 'crush', status: 'Managed-only', run: true },
  { name: 'Pool', id: 'pool', status: 'Hooks-only' },
  { name: 'Claude Desktop', id: 'claude-desktop', status: 'MCP-only' },
  { name: 'VS Code Copilot', id: 'vscode-copilot', status: 'MCP-only' },
  { name: 'Zed', id: 'zed', status: 'MCP-only' },
  { name: 'Swival CLI', id: 'swival', status: 'MCP-only' },
  { name: 'Muse Code', id: 'muse', status: 'MCP-only' },
  { name: 'Hermes Agent', id: 'hermes', status: 'Community' },
];

