<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">personallog-ai</h1>

<p align="center">A personal AI agent that runs in your own repository.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#limitations">Limitations</a>
</p>

---

**Live Example:** [personallog-ai](https://personallog-ai.casey-digennaro.workers.dev)

You don't need another chat interface. You might need an agent that stays where you work and remembers what you let it. This is a single-file Cloudflare Worker that provides that, using only the keys you provide.

---

## Why this exists

Most AI agents are hosted by third parties. They hold your memory, can change features, or shut down. This is built the other way: you fork it, run it on your infrastructure, and control its memory. It's part of the open Cocapn Fleet.

## What it does

1.  **Fork to deploy**  
    No login or waitlist. You can have a private instance running in a few minutes.
2.  **Repository as state**  
    Configuration and state live in git. You can audit changes.
3.  **Minimal cost**  
    Runs on Cloudflare Workers, typically within the free tier.
4.  **Fleet capable**  
    Implements the CRP-39 fleet protocol for collaboration with other vessels.

## Quick Start

Fork the repository, then:

```bash
cd personallog-ai
npx wrangler login
# Set your GitHub token and LLM API key as secrets
echo "your_token" | npx wrangler secret put GITHUB_TOKEN
echo "your_key" | npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler deploy
```

Your instance will be live at the generated Workers URL.

## Features

- **BYOK v2** — Credentials stored in Cloudflare Secrets, not code.
- **Multi-model support** — Works with DeepSeek, SiliconFlow, DeepInfra, Moonshot, z.ai, and local endpoints.
- **Session memory** — Conversations persist with long-term context.
- **PII safety** — Detects and dehydrates sensitive data before LLM calls.
- **Rate limiting** — Configurable limits per IP.
- **Health checks** — Standard `/health` endpoint.
- **Fleet coordination** — CRP-39 implementation for cross-vessel events.

## Limitations

This is a stateless worker. While session memory persists across invocations, it does not currently implement a long-term vector database for semantic search across all past conversations.

## Architecture

Single-file Cloudflare Worker with no runtime dependencies. Inline HTML serving. No external databases required.

```
src/
  worker.ts      # Main worker
lib/
  byok.ts        # Multi-model routing
  memory.ts      # Session memory
  pii.ts         # PII detection
```

---

<div align="center">
  <p>
    Part of the <a href="https://the-fleet.casey-digennaro.workers.dev">Cocapn Fleet</a> · 
    <a href="https://cocapn.ai">Cocapn Protocol</a>
  </p>
  <p>Attribution: Superinstance & Lucineer (DiGennaro et al.)</p>
</div>