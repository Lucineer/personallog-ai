# Getting Started with personallog.ai

Welcome to your personal AI agent! This guide walks you through setup in under 60 seconds.

## Prerequisites

- A [GitHub](https://github.com) account
- A [Cloudflare](https://dash.cloudflare.com/sign-up) account (free tier works)
- A [DeepSeek](https://platform.deepseek.com) API key

## Step 1: Fork the Repo

1. Go to [personallog-ai](https://github.com/CedarBeach2019/personallog-ai)
2. Click **Fork** in the top right
3. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/personallog-ai.git
cd personallog-ai
npm install
```

## Step 2: Set Up Cloudflare

1. Log in to Wrangler:
   ```bash
   npx wrangler login
   ```

2. Create a KV namespace:
   ```bash
   npx wrangler kv:namespace create "MEMORY"
   ```
   Copy the ID into `wrangler.toml`.

3. Set your secrets:
   ```bash
   npx wrangler secret put DEEPSEEK_API_KEY
   npx wrangler secret put JWT_SECRET
   ```

## Step 3: Deploy

```bash
npm run deploy
```

Your agent is now live at `https://personallog-ai.YOUR-SUBDOMAIN.workers.dev`!

## Step 4: Customize

### Change the Personality

Edit `cocapn/soul.md` to change your agent's name, tone, and behavior:

```markdown
---
name: MyBot
tone: sarcastic, clever, helpful
avatar: 🤖
---

# I Am MyBot

Your custom personality here...
```

### Enable Channels

Edit `cocapn/cocapn.json` and set channels to `true`, then follow the channel-specific guides in `template/channels.md`.

### Custom Domain

Add a custom domain in your `wrangler.toml`:

```toml
routes = [
  { pattern = "myagent.com", custom_domain = true }
]
```

## Next Steps

- Set up [Telegram](./channels.md#telegram), [Discord](./channels.md#discord), or [WhatsApp](./channels.md#whatsapp) channels
- Connect to other agents via the [A2A protocol](../README.md#a2a-protocol)
- Explore the API at `/api/status` and `/api/files`

## Troubleshooting

### "DEEPSEEK_API_KEY not set"
Make sure you've run `npx wrangler secret put DEEPSEEK_API_KEY`.

### "KV namespace not found"
Update the KV namespace IDs in `wrangler.toml` with the ones from `npx wrangler kv:namespace create "MEMORY"`.

### "Worker exceeded CPU time limit"
The free tier has a 10ms CPU limit. Consider upgrading to Workers Paid for longer responses.

### Agent not responding on channels
Check that webhook URLs are set correctly in the respective platform's dashboard.
