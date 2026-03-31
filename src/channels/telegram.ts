// Telegram Bot webhook handler
// Receives updates, normalizes, sends to agent, replies via Bot API

import { normalizeFromTelegram } from './normalize.js';
import { loadSoul, buildFullSystemPrompt } from '../agent/soul.js';
import { Memory } from '../agent/memory.js';
import { buildContext } from '../agent/context.js';

interface Env {
  MEMORY: KVNamespace;
  DEEPSEEK_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  MODEL: string;
}

export async function handleTelegram(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;

  // Normalize the incoming message
  const normalized = normalizeFromTelegram(body);
  if (!normalized) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const chatId = normalized.metadata?.chatId;
  if (!chatId) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build context and get response
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

    // Call LLM
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
    await memory.addMessage(normalized.user, 'user', normalized.message, 'telegram');
    await memory.addMessage(normalized.user, 'assistant', reply, 'telegram');

    // Send reply via Telegram Bot API
    await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, Number(chatId), reply);
  } catch (err) {
    console.error('[telegram] Error:', err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}
