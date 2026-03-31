# personallog.ai

**Your AI, Living in Your Repo**

Fork. Add keys. Deploy. Your personal agent is alive.

personallog.ai is a personal AI agent that lives in your Git repository. It remembers your conversations, understands your code, and connects to your favorite messaging apps. Built on [cocapn](https://github.com/nichochar/cocapn) — the paradigm where the repo IS the agent.

---

## Features

- **Persistent Memory** — Remembers everything across sessions via KV-backed storage
- **Multi-Channel** — Chat via web, Telegram, Discord, WhatsApp, or email
- **Agent-to-Agent** — Talk to other personallog.ai agents via the A2A protocol
- **Repo-Aware** — Reads and understands your files, code, and documentation
- **Self-Hosted** — Runs on Cloudflare Workers. Your data, your infrastructure
- **Open Source** — MIT licensed. Fork it, modify it, make it yours
- **Soul-Driven** — Personality defined in `cocapn/soul.md`. Edit the file, change who the agent is
- **Streaming** — Real-time SSE streaming responses for the web app
- **Guest Mode** — Share your agent with anyone (5 free messages, configurable)

---

## Quick Start

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/personallog-ai.git
cd personallog-ai
npm install
```

### 2. Add Secrets

```bash
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put JWT_SECRET
```

### 3. Deploy

```bash
npm run deploy
```

Your agent is live at `https://personallog-ai.YOUR_WORKERS_SUBDOMAIN.workers.dev`

---

## Channel Setup

### Telegram

1. Message [@BotFather](https://t.me/BotFather) to create a bot
2. Get your bot token and set it as a secret:
   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   ```
3. Set your webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR_DOMAIN/api/webhook/telegram"
   ```

### Discord

1. Create a bot at the [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable the Message Content Intent
3. Set the webhook URL in your bot's settings:
   ```
   https://YOUR_DOMAIN/api/webhook/discord
   ```
4. Set secrets:
   ```bash
   npx wrangler secret put DISCORD_BOT_TOKEN
   npx wrangler secret put DISCORD_PUBLIC_KEY
   ```

### WhatsApp (Meta Business)

1. Set up a [Meta Business app](https://business.facebook.com/)
2. Configure WhatsApp Business settings
3. Set secrets:
   ```bash
   npx wrangler secret put WHATSAPP_VERIFY_TOKEN
   npx wrangler secret put WHATSAPP_ACCESS_TOKEN
   ```
4. Set webhook URL: `https://YOUR_DOMAIN/api/webhook/whatsapp`

### Email (Cloudflare Email Workers)

Add to your `wrangler.toml`:

```toml
[[send_email]]
name = "INBOUND_EMAIL"
```

Send emails to `agent@YOUR_DOMAIN` and the agent will respond.

---

## Deployment Options

### Cloudflare Workers (Recommended)

```bash
npm run deploy
```

### Docker

```bash
docker build -t personallog-ai .
docker run -p 8787:8787 \
  -e DEEPSEEK_API_KEY=your_key \
  -e JWT_SECRET=your_secret \
  personallog-ai
```

### Local Development

```bash
npm run dev
# Opens at http://localhost:8787
```

---

## API Reference

### Chat

```
POST /api/chat
Authorization: Bearer <token>  (optional — guest mode without token)
Content-Type: application/json

{
  "message": "Hello, who are you?",
  "stream": true
}
```

Response: SSE stream of JSON chunks, or a single JSON response.

### Status

```
GET /api/status
```

```json
{
  "name": "PersonalAgent",
  "avatar": "✨",
  "files": 42,
  "memories": 10,
  "uptime": 3600,
  "channels": ["web", "telegram"]
}
```

### Files

```
GET /api/files          → List all repo files
GET /api/files/:path    → Read file content
```

### Memory

```
GET /api/memory         → List stored memories
DELETE /api/memory/:id  → Forget a memory
```

### Webhooks

```
POST /api/webhook/telegram
POST /api/webhook/discord
POST /api/webhook/whatsapp
```

### Agent-to-Agent

```
POST /api/a2a/discover   → Introduce your agent
POST /api/a2a/message    → Send a message to this agent
GET  /api/a2a/peers      → List known peer agents
```

### Analytics

```
GET /api/analytics
```

```json
{
  "totalMessages": 1234,
  "totalUsers": 5,
  "channels": { "web": 800, "telegram": 300, "discord": 134 },
  "avgResponseMs": 850
}
```

---

## A2A Protocol

Agents can talk to each other using a shared protocol:

1. **Discovery** — `POST /api/a2a/discover` with your agent's info
2. **Handshake** — Agents exchange capabilities and shared secret
3. **Messaging** — Send messages via `POST /api/a2a/message`

```typescript
// Discover another agent
await fetch('https://other-agent.workers.dev/api/a2a/discover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'MyAgent',
    url: 'https://my-agent.workers.dev',
    capabilities: ['chat', 'memory', 'files']
  })
});
```

---

## Configuration

### cocapn/cocapn.json

```json
{
  "name": "PersonalAgent",
  "provider": "deepseek",
  "model": "deepseek-chat",
  "maxMemories": 1000,
  "guestLimit": 5,
  "channels": {
    "telegram": true,
    "discord": true,
    "whatsapp": false,
    "email": false
  }
}
```

### cocapn/soul.md

Edit this file to change your agent's personality:

```markdown
---
name: PersonalAgent
tone: warm, helpful, thoughtful
avatar: ✨
---

# I Am Your Personal Agent

I live in your repo. I remember everything.
```

---

## Architecture

personallog.ai is a [cocapn](https://github.com/nichochar/cocapn) vertical — a powered repo built on the cocapn seed engine.

```
Cloudflare Worker (src/worker.ts)
  ├── Routes (HTTP → handlers)
  ├── Agent Core (src/agent/)
  │   ├── soul.ts       → Personality from soul.md
  │   ├── memory.ts     → KV-backed persistence
  │   ├── context.ts    → Smart context building
  │   ├── intelligence.ts → Code understanding
  │   └── a2a.ts        → Agent-to-agent protocol
  ├── Channels (src/channels/)
  │   ├── telegram.ts   → Telegram Bot API
  │   ├── discord.ts    → Discord webhooks
  │   ├── whatsapp.ts   → Meta Graph API
  │   └── normalize.ts  → Message normalization
  └── Static (public/)
      ├── index.html    → Landing page
      ├── app.html      → Messenger-style web app
      └── css/, js/     → Styles and logic
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

All commits by agentic workers use `Author: Superinstance`.

---

## License

MIT — see [LICENSE](./LICENSE)
