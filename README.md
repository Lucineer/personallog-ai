# personallog.ai — Your AI agent lives in your repo

You can deploy a private AI agent that remembers conversations across sessions and runs on your infrastructure. This single-file Cloudflare Worker uses only the API keys you provide, with no third-party data storage.

**Example:** [personallog-ai.casey-digennaro.workers.dev](https://personallog-ai.casey-digennaro.workers.dev)

## Why This Exists
You shouldn't have to give every thought you type to a third party just to talk to an AI. This is built for people who want an assistant that stays private and under their control.

## What Makes This Different
1.  **Not a SaaS.** There is no server run by us. There is only *your* server.
2.  **Memory lives in git.** You can browse, edit, or delete every conversation the same way you manage code.
3.  **Zero hidden code.** Every line that runs is in the single file you fork. No telemetry, no callbacks.

## Quick Start
1.  **Fork** this repository.
2.  **Deploy** to Cloudflare Workers:
    ```bash
    npx wrangler login
    echo "your_github_token" | npx wrangler secret put GITHUB_TOKEN
    echo "your_llm_key" | npx wrangler secret put DEEPSEEK_API_KEY
    npx wrangler deploy
    ```
3.  **Customize** by editing `src/index.ts`. All configuration and state live in your git history.

## Architecture
This is a stateless Cloudflare Worker. It persists session memory through Cloudflare KV storage and implements the Cocapn Fleet protocol for coordination.

## Features
- **Repository as state:** Configuration and memory live in your forked repo.
- **BYOK:** Credentials are stored only in Cloudflare Secrets.
- **Multi-model support:** Works with DeepSeek, SiliconFlow, and other compatible LLM APIs.
- **Session persistence:** Conversations maintain context across restarts.
- **PII safety:** Redacts sensitive data before any external API call.
- **Fleet coordination:** Implements the CRP-39 protocol for agent communication.
- **Zero dependencies:** A single TypeScript file. MIT licensed.

## Limitations
- Each session is limited to 1000 messages due to Cloudflare KV size constraints.

Superinstance and Lucineer (DiGennaro et al.).

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>