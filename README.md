# PersonalLog.ai

> Personal Growth AI — part of the [Cocapn](https://cocapn.ai) ecosystem

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-20_files-blue) ![Lines](https://img.shields.io/badge/lines-3140-green)

## ✨ Features

- Wellness engine
-  relationship tracker
-  mood graph
-  habit engine
-  dream journal

## 🚀 Quick Start

```bash
git clone https://github.com/Lucineer/personallog-ai.git
cd personallog-ai
npm install
npx wrangler dev
```

## 🤖 Claude Code Integration

Optimized for Claude Code with full agent support:

- **CLAUDE.md** — Complete project context, conventions, and architecture
- **.claude/agents/** — 3 specialized sub-agents for exploration, architecture, and review
- **.claude/settings.json** — Permissions and plugin configuration

Just run `claude` in the repo directory and the agent has full context.

## 🏗️ Architecture

| Component | File | Description |
|-----------|------|-------------|
| Worker | `src/worker.ts` | Cloudflare Worker with inline HTML |
| BYOK | `src/lib/byok.ts` | 7 LLM providers, encrypted keys |
| Health | `/health` | Health check endpoint |
| Setup | `/setup` | BYOK configuration wizard |
| Chat | `/api/chat` | LLM chat endpoint |
| Assets | `/public/*` | KV-served images |

**Zero runtime dependencies.** Pure TypeScript on Cloudflare Workers.

## 🔑 BYOK (Bring Your Own Key)

Supports 7 LLM providers — no vendor lock-in:

- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude 3.5, Claude 4)
- Google (Gemini Pro, Gemini Flash)
- DeepSeek (Chat, Reasoner)
- Groq (Llama, Mixtral)
- Mistral (Large, Medium)
- OpenRouter (100+ models)

Configuration discovery: URL params → Auth header → Cookie → KV → fail.

## 📦 Deployment

```bash
npx wrangler deploy
```

Requires `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables.

## 📊 Stats

- **20** TypeScript files
- **3140** lines of code
- **7** LLM providers
- **0** runtime dependencies
- **3** specialized Claude Code agents

## 🔗 Links

- 🌐 **Live**: https://personallog-ai.magnus-digennaro.workers.dev
- ❤️ **Health**: https://personallog-ai.magnus-digennaro.workers.dev/health
- ⚙️ **Setup**: https://personallog-ai.magnus-digennaro.workers.dev/setup
- 🧠 **Cocapn**: https://cocapn.ai
- 📚 **Papermill**: https://github.com/Lucineer/papermill
- 📋 **All Repos**: https://github.com/Lucineer

## 📜 License

MIT

---

Built with ❤️ by [SuperInstance](https://github.com/superinstance)
