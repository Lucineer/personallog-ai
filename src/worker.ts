// personallog.ai — Cloudflare Worker
// The repo IS the agent. Routes, auth, streaming, file serving.

import { loadSoul, soulToSystemPrompt, buildFullSystemPrompt } from './agent/soul.js';
import { Memory } from './agent/memory.js';
import { buildContext } from './agent/context.js';
import { Intelligence } from './agent/intelligence.js';
import { A2AProtocol } from './agent/a2a.js';
import { normalizeMessage } from './channels/normalize.js';
import { handleTelegram } from './channels/telegram.js';
import { handleDiscord } from './channels/discord.js';
import { handleWhatsApp } from './channels/whatsapp.js';
import { LANDING_HTML } from './landing-html.js';

// ===== Types =====
interface Env {
  MEMORY: KVNamespace;
  DEEPSEEK_API_KEY: string;
  JWT_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_PUBLIC_KEY?: string;
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  PROVIDER: string;
  MODEL: string;
  MAX_MEMORIES: string;
  GUEST_LIMIT: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AnalyticsEntry {
  timestamp: number;
  channel: string;
  user: string;
  tokensIn: number;
  tokensOut: number;
  responseMs: number;
}

// ===== Auth =====
function generateToken(payload: object, secret: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now() }));
  const signature = btoa(`${header}.${body}.${secret}`);
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string, secret: string): { user: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const expectedSig = btoa(`${parts[0]}.${parts[1]}.${secret}`);
    if (parts[2] !== expectedSig) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...headers,
    },
  });
}

// ===== Structured Error Responses =====
interface ApiError {
  error: string;
  code: string;
  retryable: boolean;
  details?: unknown;
}

function errorResponse(error: string, code: string, status: number, retryable = false, details?: unknown): Response {
  const body: ApiError = { error, code, retryable };
  if (details) body.details = details;
  return jsonResponse(body, status);
}

const ERRORS = {
  BAD_REQUEST: (msg: string) => errorResponse(msg, 'BAD_REQUEST', 400),
  UNAUTHORIZED: (msg = 'Authentication required. Provide a Bearer token or use guest mode.') =>
    errorResponse(msg, 'UNAUTHORIZED', 401),
  GUEST_LIMIT: (limit: number) =>
    errorResponse(
      `Guest limit reached (${limit} messages). Sign up for unlimited access — fork this repo!`,
      'GUEST_LIMIT',
      429,
      false,
      { upgrade: true, limit }
    ),
  RATE_LIMITED: () =>
    errorResponse('API rate limit reached. Please wait a moment and try again.', 'RATE_LIMITED', 429, true),
  CONTEXT_OVERFLOW: () =>
    errorResponse('Session too long — too much conversation history. Start a new chat to continue.', 'CONTEXT_OVERFLOW', 413, true),
  NETWORK_ERROR: (msg: string) =>
    errorResponse(`Network error: ${msg}. Check your connection and try again.`, 'NETWORK_ERROR', 502, true),
  API_ERROR: (msg: string) =>
    errorResponse(`AI service error: ${msg}`, 'API_ERROR', 502, true),
  NOT_CONFIGURED: (what: string) =>
    errorResponse(`${what} is not configured. Set the required secrets and redeploy.`, 'NOT_CONFIGURED', 503),
  INVALID_BODY: (example: object) =>
    errorResponse('Invalid request body. Check the format and try again.', 'INVALID_BODY', 400, false, { example }),
  NOT_FOUND: (path: string) =>
    errorResponse(`Not found: ${path}`, 'NOT_FOUND', 404),
  CHANNEL_DISABLED: (channel: string) =>
    errorResponse(`${channel} is not configured. Enable it in cocapn.json and set the required secrets.`, 'CHANNEL_DISABLED', 400),
  INTERNAL: (msg?: string) =>
    errorResponse(msg || 'Internal server error. Please try again.', 'INTERNAL', 500, true),
} as const;

// ===== LLM Streaming =====
async function streamChat(
  messages: ChatMessage[],
  apiKey: string,
  model: string
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  const startTime = Date.now();

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            max_tokens: 2048,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          let errorMsg = `HTTP ${response.status}`;
          let code = 'API_ERROR';
          let retryable = false;
          try { errorMsg = await response.text(); } catch { /* use default */ }

          if (response.status === 429) {
            errorMsg = 'API rate limit reached. Please wait a moment.';
            code = 'RATE_LIMITED';
            retryable = true;
          } else if (response.status === 401 || response.status === 403) {
            errorMsg = 'API key invalid or expired.';
            code = 'API_ERROR';
          } else if (response.status === 400 && errorMsg.includes('context')) {
            errorMsg = 'Session too long — start a new chat.';
            code = 'CONTEXT_OVERFLOW';
            retryable = true;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg, code, retryable })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Network error: ${msg}`, code: 'NETWORK_ERROR', retryable: true })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
}

async function chatOnce(
  messages: ChatMessage[],
  apiKey: string,
  model: string
): Promise<string> {
  let response: Response;
  try {
    response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw Object.assign(new Error(`Network error contacting AI service: ${msg}`), { code: 'NETWORK_ERROR', retryable: true });
  }

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch { /* use status */ }

    if (response.status === 429) {
      throw Object.assign(new Error('API rate limit reached. Wait a moment and try again.'), { code: 'RATE_LIMITED', retryable: true });
    }
    if (response.status === 400 && detail.includes('context')) {
      throw Object.assign(new Error('Session too long — start a new chat.'), { code: 'CONTEXT_OVERFLOW', retryable: true });
    }
    throw Object.assign(new Error(`AI service error (${response.status}): ${detail}`), { code: 'API_ERROR', retryable: response.status >= 500 });
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '';
}

// ===== File Listing =====
async function listFiles(env: Env): Promise<Array<{ path: string; type: string }>> {
  // In a real deployment, this would read from the repo
  // For Workers, we list known files from KV or a manifest
  const manifest = await env.MEMORY.get('_files_manifest', 'json') as Array<{ path: string; type: string }> | null;
  if (manifest) return manifest;

  // Default manifest for a fresh deployment
  return [
    { path: 'src/worker.ts', type: 'file' },
    { path: 'src/agent/soul.ts', type: 'file' },
    { path: 'src/agent/memory.ts', type: 'file' },
    { path: 'src/agent/context.ts', type: 'file' },
    { path: 'src/agent/intelligence.ts', type: 'file' },
    { path: 'src/agent/a2a.ts', type: 'file' },
    { path: 'src/channels/telegram.ts', type: 'file' },
    { path: 'src/channels/discord.ts', type: 'file' },
    { path: 'src/channels/whatsapp.ts', type: 'file' },
    { path: 'src/channels/normalize.ts', type: 'file' },
    { path: 'cocapn/soul.md', type: 'file' },
    { path: 'cocapn/cocapn.json', type: 'file' },
    { path: 'public/index.html', type: 'file' },
    { path: 'public/app.html', type: 'file' },
    { path: 'public/css/style.css', type: 'file' },
    { path: 'public/js/app.js', type: 'file' },
    { path: 'package.json', type: 'file' },
    { path: 'tsconfig.json', type: 'file' },
    { path: 'wrangler.toml', type: 'file' },
    { path: 'README.md', type: 'file' },
  ];
}

async function readFile(env: Env, path: string): Promise<string | null> {
  return await env.MEMORY.get(`_file:${path}`);
}

// ===== Analytics =====
async function recordAnalytics(env: Env, entry: AnalyticsEntry): Promise<void> {
  const key = `analytics:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  await env.MEMORY.put(key, JSON.stringify(entry), { expirationTtl: 90 * 24 * 3600 });
}

async function getAnalytics(env: Env): Promise<Record<string, unknown>> {
  const list = await env.MEMORY.list({ prefix: 'analytics:' });
  const entries: AnalyticsEntry[] = [];

  for (const key of list.keys) {
    const raw = await env.MEMORY.get(key.name, 'json') as AnalyticsEntry | null;
    if (raw) entries.push(raw);
  }

  const byChannel: Record<string, number> = {};
  let totalTokens = 0;
  let totalResponseMs = 0;

  for (const e of entries) {
    byChannel[e.channel] = (byChannel[e.channel] || 0) + 1;
    totalTokens += e.tokensIn + e.tokensOut;
    totalResponseMs += e.responseMs;
  }

  return {
    totalMessages: entries.length,
    channels: byChannel,
    totalTokens,
    avgResponseMs: entries.length ? Math.round(totalResponseMs / entries.length) : 0,
  };
}

// ===== Route Handler =====
async function handleChat(
  request: Request,
  env: Env,
  user: string,
  channel: string
): Promise<Response> {
  const startTime = Date.now();

  // Parse body safely
  let body: { message?: string; stream?: boolean };
  try {
    body = await request.json() as { message: string; stream?: boolean };
  } catch {
    return ERRORS.INVALID_BODY({ message: 'Hello, who are you?', stream: true });
  }

  const userMessage = body.message?.trim();

  if (!userMessage) {
    return ERRORS.INVALID_BODY({ message: 'Your message here', stream: true });
  }

  if (userMessage.length > 10000) {
    return ERRORS.BAD_REQUEST('Message too long (max 10,000 characters).');
  }

  // Load agent components
  const soul = await loadSoul(env.MEMORY);
  const memory = new Memory(env.MEMORY);
  const intelligence = new Intelligence(env.MEMORY);

  // Build conversation context
  const history = await memory.getHistory(user);
  const context = await buildContext(env.MEMORY, soul, history, userMessage);
  const systemPrompt = buildFullSystemPrompt(soul, context);

  // Cap history to prevent context overflow
  const maxHistory = 20;
  const recentHistory = history.slice(-maxHistory);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...recentHistory.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // Store user message
  await memory.addMessage(user, 'user', userMessage, channel);

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return ERRORS.NOT_CONFIGURED('DEEPSEEK_API_KEY');
  }
  const model = env.MODEL || 'deepseek-chat';

  if (body.stream) {
    // Create a TransformStream so we can track the full response
    const { readable, writable } = new TransformStream();
    let responseStream: ReadableStream;
    try {
      responseStream = await streamChat(messages, apiKey, model);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return ERRORS.NETWORK_ERROR(msg);
    }

    // Pipe through and collect for memory
    let fullResponse = '';
    const reader = responseStream.getReader();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Background: stream and save
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Extract content for memory
          const text = new TextDecoder().decode(value);
          const contentMatch = text.match(/"content"\s*:\s*"([^"]*)"/g);
          if (contentMatch) {
            for (const match of contentMatch) {
              const c = match.match(/"content"\s*:\s*"([^"]*)"/);
              if (c) fullResponse += c[1];
            }
          }

          await writer.write(value);
        }
      } finally {
        await writer.close();

        // Save to memory
        const elapsed = Date.now() - startTime;
        await memory.addMessage(user, 'assistant', fullResponse, channel);
        await memory.extractAndStore(userMessage, fullResponse);

        await recordAnalytics(env, {
          timestamp: Date.now(),
          channel,
          user,
          tokensIn: 0,
          tokensOut: 0,
          responseMs: elapsed,
        });
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...corsHeaders(),
      },
    });
  } else {
    // Non-streaming
    try {
      const response = await chatOnce(messages, apiKey, model);
      const elapsed = Date.now() - startTime;

      await memory.addMessage(user, 'assistant', response, channel);
      await memory.extractAndStore(userMessage, response);

      await recordAnalytics(env, {
        timestamp: Date.now(),
        channel,
        user,
        tokensIn: 0,
        tokensOut: 0,
        responseMs: elapsed,
      });

      return jsonResponse({ response });
    } catch (err: any) {
      if (err.code === 'RATE_LIMITED') return ERRORS.RATE_LIMITED();
      if (err.code === 'CONTEXT_OVERFLOW') return ERRORS.CONTEXT_OVERFLOW();
      if (err.code === 'NETWORK_ERROR') return ERRORS.NETWORK_ERROR(err.message);
      return ERRORS.API_ERROR(err.message || String(err));
    }
  }
}

// ===== Static File Serving =====
async function serveStatic(path: string): Promise<Response> {
  // In production, use Cloudflare Pages or Workers Sites
  // For MVP, return a redirect or embedded content
  const contentType: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const ext = path.slice(path.lastIndexOf('.'));
  const type = contentType[ext] || 'application/octet-stream';

  // Try to read from KV
  return new Response('Static files served via Cloudflare Pages or Workers Sites', {
    headers: { 'Content-Type': type },
  });
}

// ===== Main Router =====
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      // ===== Static Routes =====
      if (method === 'GET' && path === '/') {
        return new Response(LANDING_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() },
        });
      }

      if (method === 'GET' && path === '/app') {
        return new Response(
          '<!DOCTYPE html><html><head><title>personallog.ai</title></head><body><h1>Loading...</h1><p>App served via Cloudflare Pages</p></body></html>',
          { headers: { 'Content-Type': 'text/html', ...corsHeaders() } }
        );
      }

      // ===== API Routes =====

      // Status
      if (method === 'GET' && path === '/api/status') {
        const files = await listFiles(env);
        const memory = new Memory(env.MEMORY);
        const memCount = await memory.count();
        const soul = await loadSoul(env.MEMORY);

        return jsonResponse({
          name: soul.name,
          avatar: soul.avatar,
          files: files.length,
          memories: memCount,
          uptime: Date.now(),
          channels: {
            web: true,
            telegram: !!env.TELEGRAM_BOT_TOKEN,
            discord: !!env.DISCORD_BOT_TOKEN,
            whatsapp: !!env.WHATSAPP_ACCESS_TOKEN,
          },
        });
      }

      // Chat
      if (method === 'POST' && path === '/api/chat') {
        // Auth: check token or apply guest limit
        const token = getTokenFromRequest(request);
        let user = 'guest';
        let guestLimitReached = false;
        let guestUsed = 0;
        let guestLimit = 0;

        if (token && env.JWT_SECRET) {
          const decoded = verifyToken(token, env.JWT_SECRET);
          if (decoded) {
            user = decoded.user;
          }
        } else {
          // Guest mode — track per IP
          const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
          const guestKey = `_guest:${ip}`;
          const guestCount = parseInt(await env.MEMORY.get(guestKey) || '0');
          guestLimit = parseInt(env.GUEST_LIMIT || '5');
          guestUsed = guestCount;
          if (guestCount >= guestLimit) {
            guestLimitReached = true;
          } else {
            guestUsed = guestCount + 1;
            await env.MEMORY.put(guestKey, String(guestUsed));
          }
        }

        if (guestLimitReached) {
          return ERRORS.GUEST_LIMIT(parseInt(env.GUEST_LIMIT || '5'));
        }

        const chatResponse = await handleChat(request, env, user, 'web');

        // Add guest usage header for the UI to read
        if (user === 'guest') {
          const headers = new Headers(chatResponse.headers);
          headers.set('X-Guest-Used', String(guestUsed));
          headers.set('X-Guest-Limit', String(guestLimit));
          return new Response(chatResponse.body, {
            status: chatResponse.status,
            statusText: chatResponse.statusText,
            headers,
          });
        }

        return chatResponse;
      }

      // Demo status — returns guest usage for this IP
      if (method === 'GET' && path === '/api/demo/status') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const token = getTokenFromRequest(request);
        const limit = parseInt(env.GUEST_LIMIT || '5');

        if (token && env.JWT_SECRET) {
          const decoded = verifyToken(token, env.JWT_SECRET);
          if (decoded) {
            return jsonResponse({ guest: false, used: 0, limit: 0 });
          }
        }

        const used = parseInt(await env.MEMORY.get(`_guest:${ip}`) || '0');
        return jsonResponse({ guest: true, used, limit });
      }

      // Files
      if (method === 'GET' && path === '/api/files') {
        const files = await listFiles(env);
        return jsonResponse(files);
      }

      if (method === 'GET' && path.startsWith('/api/files/')) {
        const filePath = decodeURIComponent(path.slice('/api/files/'.length));
        const content = await readFile(env, filePath);
        if (content === null) {
          return ERRORS.NOT_FOUND(`file:${filePath}`);
        }
        return new Response(content, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() },
        });
      }

      // Memory
      if (method === 'GET' && path === '/api/memory') {
        const memory = new Memory(env.MEMORY);
        const facts = await memory.getAllFacts();
        return jsonResponse({ facts });
      }

      if (method === 'DELETE' && path.startsWith('/api/memory/')) {
        const key = decodeURIComponent(path.slice('/api/memory/'.length));
        const memory = new Memory(env.MEMORY);
        await memory.deleteFact(key);
        return jsonResponse({ ok: true });
      }

      // ===== Webhook Channels =====
      if (method === 'POST' && path === '/api/webhook/telegram') {
        if (!env.TELEGRAM_BOT_TOKEN) return ERRORS.CHANNEL_DISABLED('Telegram');
        return await handleTelegram(request, env);
      }

      if (method === 'POST' && path === '/api/webhook/discord') {
        if (!env.DISCORD_BOT_TOKEN) return ERRORS.CHANNEL_DISABLED('Discord');
        return await handleDiscord(request, env);
      }

      if (method === 'POST' && path === '/api/webhook/whatsapp') {
        if (!env.WHATSAPP_ACCESS_TOKEN) return ERRORS.CHANNEL_DISABLED('WhatsApp');
        return await handleWhatsApp(request, env);
      }

      // WhatsApp verification
      if (method === 'GET' && path === '/api/webhook/whatsapp') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }
        return errorResponse('Invalid verification', 'FORBIDDEN', 403);
      }

      // ===== A2A Protocol =====
      if (method === 'POST' && path === '/api/a2a/discover') {
        const a2a = new A2AProtocol(env.MEMORY);
        const body = await request.json() as { name: string; url: string; capabilities?: string[] };
        await a2a.registerPeer(body);
        return jsonResponse({ ok: true, message: 'Peer registered' });
      }

      if (method === 'POST' && path === '/api/a2a/message') {
        const body = await request.json() as { from: string; message: string };
        // Process as a chat from the peer agent
        const mockReq = new Request(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: body.message, stream: false }),
        });
        return await handleChat(mockReq, env, `a2a:${body.from}`, 'a2a');
      }

      if (method === 'GET' && path === '/api/a2a/peers') {
        const a2a = new A2AProtocol(env.MEMORY);
        const peers = await a2a.getPeers();
        return jsonResponse({ peers });
      }

      // ===== Analytics =====
      if (method === 'GET' && path === '/api/analytics') {
        const analytics = await getAnalytics(env);
        return jsonResponse(analytics);
      }

      // 404
      return ERRORS.NOT_FOUND(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[worker] Unhandled error:', message);
      return ERRORS.INTERNAL(message);
    }
  },
};
