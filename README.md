<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">personallog-ai</h1>

<p align="center">A personal AI agent you host from your own repository. Free, open-source, fork-and-deploy.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#limitations">Limitations</a> ·
  <a href="#the-fleet">The Fleet</a>
</p>

---

**Example:** [personallog-ai.casey-digennaro.workers.dev](https://personallog-ai.casey-digennaro.workers.dev)
Built on Capitaine. Part of the Cocapn Fleet. Attributions: Superinstance & Lucineer (DiGennaro et al.).

You can host an AI agent that belongs to you. It runs from a repository you control, with code you can see. It doesn't train on your data unless you configure it to.

This is a deployable worker, not a service. Fork it, set your keys, and host it yourself.

---

## Quick Start

You need a GitHub account and a Cloudflare account. Then:

```bash
# Fork and clone
gh repo fork Lucineer/personallog-ai --clone
cd personallog-ai

# Log into Cloudflare Workers
npx wrangler login

# Set your API keys as secrets (never in git)
echo "your-github-token" | npx wrangler secret put GITHUB_TOKEN
echo "your-llm-key" | npx wrangler secret put DEEPSEEK_API_KEY

# Deploy
npx wrangler deploy
```

Your instance will run at the generated `.workers.dev` URL.

## Features

- **Bring Your Own Keys v2** — Credentials stored in Cloudflare Secrets, not code.
- **Multi-model routing** — Compatible with DeepSeek, SiliconFlow, DeepInfra, and other OpenAI-compatible endpoints.
- **Context persistence** — Session memory stored as markdown in your repository.
- **PII detection** — Basic redaction for phone numbers and emails before sending to LLMs.
- **Per-IP rate limiting** — Prevents single-user overuse on public endpoints.
- **Health endpoint** — Standard `/health` for uptime checks.
- **Fleet protocol** — Implements CRP-39 for peer discovery via public git.

## Limitations

This is a single-file Cloudflare Worker. It stores conversation state as markdown files in your repository. It does not have a built-in database or support for high-volume, concurrent usage. You are responsible for the costs of your LLM API calls.

## The Fleet

This repository follows the open [Cocapn Fleet Protocol](https://the-fleet.casey-digennaro.workers.dev). It's part of a network of independent, self-hosted agents that can discover each other through git.

---

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> ·
  <a href="https://cocapn.ai">Cocapn</a>
</div>