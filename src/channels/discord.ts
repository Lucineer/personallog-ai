// Discord webhook handler
// Receives interactions, normalizes, sends to agent, responds via webhook

import { normalizeFromDiscord } from './normalize.js';
import { loadSoul, buildFullSystemPrompt } from '../agent/soul.js';
import { Memory } from '../agent/memory.js';
import { buildContext } from '../agent/context.js';

interface Env {
  MEMORY: KVNamespace;
  DEEPSEEK_API_KEY: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  MODEL: string;
}

const DISCORD_API = 'https://discord.com/api/v10';

export async function handleDiscord(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;

  // Discord ping verification
  if (body.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle slash command or message
  const normalized = normalizeFromDiscord(body);
  if (!normalized) {
    return new Response(JSON.stringify({ type: 4, data: { content: 'Could not process message.' } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Acknowledge immediately (Discord requires <3s response)
  const interactionId = normalized.metadata?.interactionId as string;
  const interactionToken = body.token as string;

  // Process in background
  (async () => {
    try {
      const soul = await loadSoul(env.MEMORY);
      const memory = new Memory(env.MEMORY);
      const history = await memory.getHistory(normalized.user);
      const context = await buildContext(env.MEMORY, soul, history, normalized.message);
      const systemPrompt = buildFullSystemPrompt(soul, context);

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: normalized.message },
      ];

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.MODEL || 'deepseek-chat',
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';

      // Save to memory
      await memory.addMessage(normalized.user, 'user', normalized.message, 'discord');
      await memory.addMessage(normalized.user, 'assistant', reply, 'discord');

      // Send followup response via Discord API
      await sendDiscordFollowup(env.DISCORD_BOT_TOKEN, interactionId, interactionToken, reply);
    } catch (err) {
      console.error('[discord] Error:', err);
      await sendDiscordFollowup(
        env.DISCORD_BOT_TOKEN,
        interactionId,
        interactionToken,
        'Sorry, an error occurred processing your message.'
      );
    }
  })();

  // Immediate acknowledgment — deferred response
  return new Response(JSON.stringify({ type: 5 }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendDiscordFollowup(
  botToken: string,
  interactionId: string,
  interactionToken: string,
  content: string
): Promise<void> {
  // Discord allows followup messages via webhook
  const webhookUrl = `${DISCORD_API}/webhooks/${interactionId}/${interactionToken}`;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}
