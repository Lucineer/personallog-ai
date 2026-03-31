# Channel Setup Guides

Connect your agent to your favorite messaging platforms.

---

## Telegram

### 1. Create a Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow the prompts to set a name and username
4. Copy the **bot token** (looks like `123456789:ABCdefGHI...`)

### 2. Configure Secrets

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your bot token when prompted
```

### 3. Set Webhook

Replace `<TOKEN>` with your bot token and `<YOUR_DOMAIN>` with your Workers domain:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<YOUR_DOMAIN>/api/webhook/telegram"
```

### 4. Test

Send a message to your bot on Telegram. It should respond!

---

## Discord

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to **Bot** tab and click **Add Bot**
4. Enable **Message Content Intent** under Privileged Gateway Intents
5. Copy the **bot token**

### 2. Configure Secrets

```bash
npx wrangler secret put DISCORD_BOT_TOKEN
npx wrangler secret put DISCORD_PUBLIC_KEY
```

The public key is found in your application's **General Information** page.

### 3. Invite the Bot

Generate an invite URL from the **OAuth2 > URL Generator** tab with these scopes:
- `bot`
- `applications.commands`

Permissions: Send Messages, Read Message History.

### 4. Set Interaction URL

In the **General Information** page, set the Interactions Endpoint URL to:
```
https://<YOUR_DOMAIN>/api/webhook/discord
```

---

## WhatsApp (Meta Business)

### 1. Set Up Meta Business

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app (type: Business)
3. Add the **WhatsApp** product
4. Get the **Access Token** and **Phone Number ID**

### 2. Configure Secrets

```bash
npx wrangler secret put WHATSAPP_VERIFY_TOKEN
# Set a custom verify token (any random string)

npx wrangler secret put WHATSAPP_ACCESS_TOKEN
# Paste the Meta access token
```

### 3. Configure Webhook

In the WhatsApp settings in your Meta app dashboard:

1. Set the **Callback URL** to:
   ```
   https://<YOUR_DOMAIN>/api/webhook/whatsapp
   ```
2. Set the **Verify Token** to the same value you set in `WHATSAPP_VERIFY_TOKEN`
3. Subscribe to the `messages` webhook field

### 4. Update Phone Number ID

In `src/channels/whatsapp.ts`, replace `YOUR_PHONE_NUMBER_ID` with your actual Phone Number ID from Meta.

---

## Email (Cloudflare Email Routing)

### 1. Enable Email Routing

1. In your Cloudflare dashboard, go to your domain
2. Enable **Email Routing**
3. Add a route: `agent@yourdomain.com` → Worker

### 2. Add to wrangler.toml

```toml
[[send_email]]
name = "INBOUND_EMAIL"
```

### 3. Handle in Worker

Emails sent to `agent@yourdomain.com` will be forwarded to your worker as a `message` event.

---

## General Notes

- Each channel normalizes messages through `src/channels/normalize.ts`
- Channel handlers store messages in shared memory (KV)
- The agent has full context across all channels
- To disable a channel, set it to `false` in `cocapn/cocapn.json`
