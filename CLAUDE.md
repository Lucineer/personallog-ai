# CLAUDE.md — PersonalLog.ai

## 1. Project Overview

PersonalLog.ai is a personal growth AI application that helps users track wellness, relationships, moods, habits, and dreams through conversational AI. It's part of the Cocapn ecosystem (cocapn.ai) and lives under the Lucineer GitHub organization.

**Core concept:** Bring Your Own Key (BYOK) LLM routing — users supply their own API keys for OpenAI, Anthropic, Google, Mistral, Groq, Cohere, or DeepSeek. The app routes chat requests to their chosen provider with zero stored credentials required.

**Theme:** Personal growth. **Accent:** Amber (#fbbf24).

---

## 2. Architecture Summary

```
User → Cloudflare Worker (src/worker.ts)
         ├── /health        → status check
         ├── /setup         → BYOK key setup page
         ├── /api/chat      → AI conversation (routed via BYOK)
         ├── /api/byok      → BYOK config management
         ├── /public/*      → static asset routes
         └── /*             → inline HTML app shell
                    ↓
         src/lib/byok.ts    → LLM provider routing
                    ↓
         PERSONALLOG_MEMORY (KV) → session/config storage
```

**Modules built into the inline HTML:**
- Wellness engine — holistic health tracking
- Relationship tracker — interpersonal dynamics
- Mood graph — emotional patterns over time
- Habit engine — routine building and streaks
- Dream journal — dream logging and analysis

---

## 3. Key Commands

```bash
wrangler dev          # Local development server
wrangler deploy       # Deploy to Cloudflare Workers
git push              # Push to main (triggers deploy if CI configured)
wrangler tail         # Live log streaming
wrangler kv:key list  # Inspect KV store
```

---

## 4. Code Style and Conventions

- **TypeScript only**, no build step — Cloudflare Workers runs TS natively via wrangler
- **Zero runtime dependencies** for MVP — no npm packages in production
- **All HTML is inline** in worker.ts — no ASSETS binding, no separate template files
- **Single-file entry point** — worker.ts handles all routing and HTML serving
- **BYOK config discovery order:** URL params → Authorization header → Cookie → KV → fail with 401
- **Commits attributed to:** `Author: Superinstance`
- **Brand colors:** Amber (#fbbf24) as accent, warm personal palette
- **No framework** — vanilla TS, Fetch API, standard Workers runtime

---

## 5. Testing Approach

- Manual testing via `wrangler dev` local server
- `/health` endpoint for uptime monitoring
- BYOK provider validation on each `/api/chat` request
- No automated test suite in MVP — keep it simple

---

## 6. Important File Paths

| Path | Purpose |
|------|---------|
| `src/worker.ts` | Worker entry point, all routes, inline HTML |
| `src/lib/byok.ts` | BYOK module — 7 LLM providers, config discovery, routing |
| `wrangler.toml` | Cloudflare Workers config, KV bindings |
| `tsconfig.json` | TypeScript config for Workers runtime |
| `package.json` | Minimal — wrangler dev dependency only |

---

## 7. What NOT to Change

- **BYOK module structure** (src/lib/byok.ts) — stable, 7-provider routing is locked for MVP
- **Inline HTML pattern** — no migration to ASSETS binding or external templates yet
- **Config discovery order** — URL params → Auth header → Cookie → KV → fail — this is the security model
- **KV binding name** `PERSONALLOG_MEMORY` — referenced across ecosystem tooling
- **Amber brand color** (#fbbf24) — ecosystem-wide visual identity
- **Commit author attribution** — always "Superinstance"

---

## 8. How to Add New Features

1. **New module** — Create `src/lib/<module>.ts` with exported functions
2. **Import** — Add import to `src/worker.ts`
3. **Add route** — Append route handler in worker.ts fetch handler
4. **UI** — Add inline HTML/JS for the feature within worker.ts template strings
5. **KV usage** — Use `env.PERSONALLOG_MEMORY` for any persistent state
6. **Test** — Run `wrangler dev`, verify locally, then `wrangler deploy`

Example pattern for a new route:
```
if (url.pathname === '/api/newfeature') {
  return handleNewFeature(request, env);
}
```

---

## 9. Deployment Instructions

1. Ensure `wrangler.toml` has correct account ID and KV binding
2. Run `wrangler whoami` to verify authentication
3. `wrangler deploy` — pushes to Cloudflare edge network
4. Verify at `https://personallog.ai/health`
5. For custom domain, configure in Cloudflare dashboard → Workers → Routes

**KV setup (first time only):**
```bash
wrangler kv:namespace create PERSONALLOG_MEMORY
# Add the returned ID to wrangler.toml
```

---

## 10. Ecosystem Links

- **Cocapn.ai** — parent ecosystem hub (cocapn.ai)
- **GitHub org:** [Lucineer](https://github.com/Lucineer) — all *log.ai repos
- **Related projects:** Other *log.ai repos under Lucineer (BusinessLog.ai, TravelLog.ai, etc.)
- **Shared conventions:** BYOK pattern, amber accent, inline HTML worker pattern, "Superinstance" commit author

---

*PersonalLog.ai — Personal growth, powered by your own AI keys.*
