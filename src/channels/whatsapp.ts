// WhatsApp Business webhook handler
// Receives messages via Meta Graph API, normalizes, sends to agent, replies

import { normalizeFromWhatsApp } from './normalize.js';
import { loadSoul, buildFullSystemPrompt } from '../agent/soul.js';
import { Memory } from '../agent/memory.js';
import { buildContext } from '../agent/context.js';

interface Env {
  MEMORY: KVNamespace;
  DEEPSEEK_API_KEY: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_ACCESS_TOKEN: string;
  MODEL: string;
}

const WHATSAPP_API = 'https://graph.facebook.com/v18.0';

export async function handleWhatsApp(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;

  // Normalize the incoming message
  const normalized = normalizeFromWhatsApp(body);
  if (!normalized) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const phoneNumber = normalized.metadata?.phoneNumber as string;
  if (!phoneNumber) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Process message in background
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
      await memory.addMessage(normalized.user, 'user', normalized.message, 'whatsapp');
      await memory.addMessage(normalized.user, 'assistant', reply, 'whatsapp');

      // Send reply via WhatsApp API
      await sendWhatsAppMessage(env.WHATSAPP_ACCESS_TOKEN, phoneNumber, reply);
    } catch (err) {
      console.error('[whatsapp] Error:', err);
    }
  })();

  // WhatsApp expects a 200 OK immediately
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendWhatsAppMessage(
  accessToken: string,
  to: string,
  text: string
): Promise<void> {
  // Use the phone number ID from the WhatsApp Business account
  // This would be configured in cocapn.json or env vars
  const phoneNumberId = 'YOUR_PHONE_NUMBER_ID';

  await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}
