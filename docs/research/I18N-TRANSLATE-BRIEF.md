# Brief: translate catalogs for aimemory.io

You translate the English message catalogs in `/mnt/data/Projects/ai-memory-web/src/i18n/locales/en/` into ONE target language, writing files with the same names and the same JSON structure under `src/i18n/locales/<locale>/`. The site sells ai-memory, an open source long-term memory server for AI coding agents, to software developers. Read `docs/design-system.md` (section "Writing") for the voice: short, plain, direct, honest, no hype.

## Non-negotiable mechanics
- Same keys, same nesting, same array lengths as English. Never add, remove, rename or reorder keys. Translate values only.
- `{placeholders}` stay exactly as written (`{n}`, `{tag}`, `{href}`), placed where the target grammar wants them.
- HTML tags and their attributes stay exactly as written (`<code>`, `<strong>`, `<a class="..." href="{href}">`). Translate the text between tags. Everything inside `<code>...</code>` stays byte-for-byte identical.
- Do NOT translate: shell commands, flags, env vars, file and directory names (`wiki/`, `index.md`, `.ai-memory.toml`), config keys, URLs, version numbers, product and project names (ai-memory, Claude Code, Codex, Cursor, Gemini CLI, Mem0, Zep, Graphiti, cognee, OpenViking, Hindsight, Obsidian, Netlify, GitHub...), crate names, protocol and tech names (MCP, LLM, API, SQLite, FTS5, RRF, OKF, OIDC, TLS, SSO, JSON, YAML, git, markdown, Docker, systemd), benchmark names (LongMemEval-S, hit@5), people's names.
- Terminal lines in `home.json` under `continuity.scenes.*.in/out`: lines starting with `>`, `●`, `~`, or containing a command or a path stay as they are. Translate only the natural-language lines (the handoff summary, "this week", "Lia, first day", the people lines after the `|`). Keep the `Name|text` and `dir/|file` separators.
- Valid UTF-8 JSON. Escape double quotes inside values. Use the target language's real typography (accents, punctuation), never ASCII approximations.
- After each file, run `cd /mnt/data/Projects/ai-memory-web && node scripts/check-i18n.mjs <locale>` and fix every ERROR. "identical to English" warnings are fine when the string is a name or a command.

## Quality bar: this must read as if written by a native-speaking developer, not translated
- Translate meaning, not words. Restructure sentences freely. If a literal rendering sounds stiff, rewrite it the way a local senior engineer would say it to a colleague.
- Keep it as short as the English. Headlines must stay headlines: punchy, no longer than the English by more than about 30%, because they sit in fixed layouts. Button labels stay two to four words.
- Keep the honesty: where English says the project is behind or has a limit, say it just as plainly.
- The English avoids AI-writing tells, and so must you, in the target language's own equivalents: no dashes used as connectors (em dash, en dash, or the Japanese ―), no "not X but Y" constructions for emphasis, no closing one-liners that restate the point, no rows of dramatic fragments, no forced groups of three, no hype adjectives (the local equivalents of seamless, robust, powerful, unlock, effortless, revolutionary), no sentences that comment on the documentation instead of stating the fact. Go straight to the point, always.
- Developer vocabulary: use the term local developers actually use at work. When the community uses the English word, keep the English word (see the glossary). Never invent a purist translation nobody says.
- Consistency: one English term maps to one target term across every file. Follow the glossary below. If you must decide a term the glossary lacks, write it down in `docs/i18n/glossary-<locale>.md` (create the file, a simple two-column table) so the next translator reuses it.
- SEO strings (`meta.title`, `meta.description`): use the words people in that language actually type into a search engine. Titles under 60 characters, descriptions 140 to 160 characters (for Japanese: titles under 30 full-width characters, descriptions 80 to 110).
- Quotations (Fabio Akita, Andrej Karpathy) are translated faithfully; the attribution line is translated too. For pt-br, note that Fabio Akita is Brazilian and his original post is in Portuguese: prefer natural Brazilian wording.

## Glossary
| English | pt-br | es | he | ja |
|---|---|---|---|---|
| long-term memory | memória de longo prazo | memoria a largo plazo | זיכרון לטווח ארוך | 長期記憶 |
| AI coding agent | agente de código com IA (short: agente) | agente de programación con IA (short: agente) | סוכן קוד מבוסס AI (short: סוכן) | AIコーディングエージェント (short: エージェント) |
| harness | harness | harness | harness | ハーネス |
| handoff | handoff | traspaso (handoff) first time, then traspaso | העברת מקל (handoff) first time, then העברה | 引き継ぎ (ハンドオフ) first time, then 引き継ぎ |
| baton | bastão | testigo | מקל השליחים | バトン |
| hooks / lifecycle hooks | hooks / hooks de ciclo de vida | hooks / hooks de ciclo de vida | hooks (הוקים) / hooks של מחזור החיים | フック / ライフサイクルフック |
| capture | captura | captura | לכידה | キャプチャ |
| consolidate | consolidar | consolidar | איחוד / לאחד | 統合 |
| recall | recuperação / lembrar | recuperación / recordar | שליפה | 想起 / 呼び出し |
| briefing / brief | briefing / resumo | resumen | תדריך | ブリーフィング |
| session | sessão | sesión | סשן | セッション |
| observation | observação | observación | תצפית | オブザベーション (観測) |
| wiki | wiki | wiki | ויקי | wiki |
| page | página | página | דף | ページ |
| source of truth | fonte da verdade | fuente de verdad | מקור האמת | 信頼できる唯一の情報源 (short: 正) |
| derived index | índice derivado | índice derivado | אינדקס נגזר | 派生インデックス |
| one binary | um binário só | un solo binario | קובץ בינארי אחד | 単一バイナリ |
| self-hosted | self-hosted | autoalojado (self-hosted) | באירוח עצמי | セルフホスト |
| server | servidor | servidor | שרת | サーバー |
| team / teammate | time / colega de time | equipo / compañero de equipo | צוות / חבר צוות | チーム / チームメンバー |
| onboarding | onboarding | onboarding (incorporación) | קליטה (onboarding) | オンボーディング |
| API key | chave de API | clave de API | מפתח API | APIキー |
| token | token | token | טוקן | トークン |
| embeddings | embeddings | embeddings | embeddings (הטמעות) | 埋め込み (embeddings) |
| vector search | busca vetorial | búsqueda vectorial | חיפוש וקטורי | ベクトル検索 |
| full-text search | busca full-text | búsqueda de texto completo | חיפוש טקסט מלא | 全文検索 |
| knowledge graph | grafo de conhecimento | grafo de conocimiento | גרף ידע | ナレッジグラフ |
| benchmark | benchmark | benchmark | בנצ'מרק | ベンチマーク |
| open source | open source | código abierto (open source) | קוד פתוח | オープンソース |
| pull request / issue | pull request / issue | pull request / issue | pull request / issue | プルリクエスト / Issue |
| changelog / release | changelog / release | changelog / versión | יומן שינויים / גרסה | 変更履歴 / リリース |
| quick setup | instalação rápida | instalación rápida | התקנה מהירה | クイックセットアップ |
| download | download / baixar | descarga / descargar | הורדה | ダウンロード |
| audit log | log de auditoria | registro de auditoría | יומן ביקורת | 監査ログ |
| air-gapped | air-gapped (sem rede) | air-gapped (sin red) | מנותק מהרשת (air-gapped) | エアギャップ |
| homelab | homelab | homelab | homelab (מעבדה ביתית) | ホームラボ |

## Per-language voice
- **pt-br**: Brazilian Portuguese as Brazilian developers write it. "Você", informal and direct, no "vós/tu". English tech terms are normal and expected (deploy, commit, handoff, hooks, release). Never European spellings or vocabulary (no "ficheiro", "ecrã", "utilizador": use "arquivo", "tela", "usuário"). Sentence case in headings.
- **es**: neutral international Spanish that reads well in Spain and Latin America. "Tú", direct. Prefer "ordenador/computadora"-neutral wording ("equipo", "máquina"). Opening ¿ and ¡ are mandatory. Sentence case in headings.
- **he**: modern Israeli tech Hebrew, no niqqud. The page is right to left. Avoid gendered address where you can: prefer infinitives, plural or impersonal forms ("אפשר להתקין", "מתקינים") over masculine singular imperatives. Latin-script names and commands stay in Latin script inside the Hebrew sentence. Punctuation goes at the logical end of the sentence. Use Hebrew quotation marks only as plain ".
- **ja**: です・ます style, polite and concise, the register of good Japanese developer documentation (like official Rust or Vercel docs in Japanese). No spaces between Japanese words; a half-width space between Japanese and Latin words is NOT used either, except inside product names. Full-width punctuation 、。「」, half-width alphanumerics. Katakana for standard loanwords; do not katakana-ize product names. Headlines may use 体言止め (noun endings) when that is punchier. Avoid long chains of の.

## Working alongside other translators
Several translators work on the same language at once, on different files. Before you start, read `docs/i18n/glossary-<locale>.md` if it exists and any catalogs already present in your locale folder (especially `common.json`, `home.json`, `competitors.json`, `support.json`) and reuse their terms and tone, so the site reads as one voice. Page kickers, nav labels and button labels that also appear in `common.json` must match it exactly. Add your own term decisions to the glossary file (append; never rewrite another translator's rows). Work file by file: write a file, run the check, fix, move on. Large files are fine to write in one go, but never leave a file half translated with English values; omit nothing.
