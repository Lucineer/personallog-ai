# PersonalLog — Your Personal AI That Remembers Everything

> *The simplest cocapn vessel. Fork it, add your API key, deploy. It works.*

## What It Is

PersonalLog is a personal AI companion that lives in your repo. It remembers every conversation, every preference, every context. It's not a chatbot that forgets you between sessions — it's an AI that grows with you.

## Why It's Different

Every AI chatbot starts fresh. PersonalLog starts where you left off. After a week, it knows your routines. After a month, it anticipates your needs. After a year, it's irreplaceable.

This is possible because **the repo IS the agent**. Every conversation, every preference, every piece of context lives in your repo. You own it. You control it. No corporation can take it away.

## Features

- 💬 **Persistent chat** — remembers every conversation
- 🧠 **Smart context** — prioritizes recent > relevant > old (~4K tokens)
- 🔒 **Private by default** — your data, your repo, your control
- 🌐 **Deploy anywhere** — Cloudflare Workers (free), Docker, local
- 🔑 **BYOK** — bring any LLM key (DeepSeek, Claude, GPT, Ollama)
- 📱 **Mobile-ready** — works on phone, tablet, desktop
- 🎨 **Clean UI** — simple, fast, no bloat

## Quick Start

```bash
# 1. Fork on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/personallog-ai.git
cd personallog-ai

# 3. Install
npm install

# 4. Run locally (free)
DEEPSEEK_API_KEY=your-key npx wrangler dev

# 5. Open http://localhost:8787
```

## Deploy to Cloudflare (free tier)

```bash
# Set your API key
npx wrangler secret put DEEPSEEK_API_KEY

# Deploy
npx wrangler deploy

# Your AI is live at your-subdomain.workers.dev
```

## Deploy with Custom Domain

```bash
# In Cloudflare dashboard, add custom domain to your Worker
# Point your DNS: personallog.yourdomain.com → your Worker
```

## The Two-Repo Model

PersonalLog works best with two repos:
1. **Public repo** (this one) — the face, the UI, the public personality
2. **Private repo** — the brain, the memories, the secrets

The public repo has no secrets. The private repo has everything. The cocapn gateway ensures secrets never leak.

## Build Status

✅ Working — boots locally and on Cloudflare Workers
✅ SSE streaming chat with DeepSeek
✅ Session management
✅ Dark theme UI
✅ Mobile responsive
✅ Guest mode (5 free messages)
📝 Roadmap: BYOK provider switching, Docker support, A2A bridge

## Philosophy

Less is more. PersonalLog does one thing well: it remembers you. No features you'll never use. No bloat. Just a clean, fast AI that grows with you.

The most important product is the simplest one that works.

Author: Superinstance
