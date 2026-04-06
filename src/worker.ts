import { addNode, addEdge, traverse, crossDomainQuery, findPath, domainStats, getDomainNodes } from './lib/knowledge-graph.js';
import { loadSeedIntoKG, FLEET_REPOS, loadAllSeeds } from './lib/seed-loader.js';
import { evapPipeline, getEvapReport, getLockStats } from './lib/evaporation-pipeline.js';
import { callLLM, generateSetupHTML } from './lib/byok.js';
import { deadbandCheck, deadbandStore } from './lib/deadband.js';
import { loadStats, recordHit, recordMiss } from './lib/response-logger.js';
import { softActualize, confidenceScore } from './lib/soft-actualize.js';
import { WellnessEngine } from './lib/wellness-engine';
import { MoodGraph } from './lib/mood-graph';
import { HabitEngine } from './lib/habit-engine';
import { DreamJournal } from './lib/dream-journal';
import { GoalSystem } from './lib/goal-system';
import { GrowthTracker } from './lib/growth';
import { Journal } from './lib/journal';
import { getTracker } from './lib/confidence-tracker.js';
import { getRouter } from './lib/model-router.js';

interface Env {
	PERSONALLOG_MEMORY: KVNamespace;
}

const serializeState = async (env: Env, key: string, data: any): Promise<void> => {
	await env.PERSONALLOG_MEMORY.put(key, JSON.stringify(data));
};

const deserializeState = async <T>(env: Env, key: string): Promise<T | null> => {
	const raw = await env.PERSONALLOG_MEMORY.get(key);
	return raw ? JSON.parse(raw) : null;
};

const jsonResponse = (data: any, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.deepseek.com https://api.groq.com https://api.mistral.ai https://openrouter.ai https://api.z.ai https://*;",
		},
	});

const errorHandler = (err: any) => {
	console.error('Worker Error:', err);
	return jsonResponse({ success: false, error: err.message || 'Internal Server Error' }, 500);
};

function landing(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>PersonalLog.ai — Watch AI Hold Space for Reflection</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#0a0a1a;color:#e0e0e0}.hero{background:linear-gradient(135deg,#6366f1,#06b6d4);padding:5rem 2rem 3rem;text-align:center}.hero h1{font-size:3rem;background:linear-gradient(90deg,#a5b4fc,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}.hero .tagline{color:#94a3b8;font-size:1.1rem;max-width:550px;margin:0 auto 1.5rem}.fork-btns{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap}.fork-btns a{padding:.5rem 1.2rem;background:rgba(99,102,241,.15);border:1px solid #6366f144;border-radius:8px;color:#a5b4fc;text-decoration:none;font-size:.85rem}.demo-section{max-width:800px;margin:0 auto 3rem;padding:0 1rem}.demo-label{color:#06b6d4;font-size:.8rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.demo-label::before,.demo-label::after{content:'';flex:1;height:1px;background:#1e1b4b33}.chat{background:#13112b;border:1px solid #1e1b4b;border-radius:12px;overflow:hidden;font-size:.9rem}.msg{padding:.8rem 1.2rem;border-bottom:1px solid #1e1b4b33;display:flex;gap:.8rem}.msg:last-child{border-bottom:none}.msg.user{background:#0f0d24}.msg.agent{background:#13112b}.avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0}.msg.user .avatar{background:#6366f1;color:#fff}.msg.agent .avatar{background:#06b6d4;color:#0a0a1a;font-weight:700}.msg-body{flex:1}.msg-name{font-size:.72rem;color:#4338ca;margin-bottom:.15rem}.msg-text{color:#c7d2fe;line-height:1.5}.msg-text .label{color:#06b6d4;font-size:.75rem;font-weight:600}.msg-text .pattern{background:#1e1b4b;border-left:3px solid #6366f1;padding:.5rem .8rem;border-radius:0 6px 6px 0;margin:.5rem 0;font-size:.85rem;color:#a5b4fc}.byok{max-width:600px;margin:0 auto 2rem;padding:0 1rem}.byok h3{color:#a5b4fc;margin-bottom:.8rem;font-size:1rem}.byok-row{display:flex;gap:.5rem}.byok-row input{flex:1;padding:.6rem 1rem;background:#13112b;border:1px solid #1e1b4b;border-radius:8px;color:#e0e0e0}.byok-row button{padding:.6rem 1.5rem;background:linear-gradient(135deg,#6366f1,#06b6d4);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer}.fork-bar{max-width:800px;margin:0 auto 3rem;padding:0 1rem;background:#13112b;border:1px solid #1e1b4b;border-radius:12px;padding:1.5rem}.fork-bar h3{color:#06b6d4;margin-bottom:.8rem;font-size:1rem}.deploy-box{background:#0a0a1a;border:1px solid #1e1b4b;border-radius:8px;padding:1rem;position:relative}.deploy-box code{font-family:monospace;font-size:.78rem;color:#a5b4fc;display:block;white-space:pre-wrap}.copy-btn{position:absolute;top:.5rem;right:.5rem;background:#1e1b4b;border:none;border-radius:4px;color:#6366f1;padding:.2rem .5rem;font-size:.7rem;cursor:pointer}.footer{text-align:center;padding:2rem;color:#4338ca55;font-size:.8rem;border-top:1px solid #1e1b4b33}</style></head><body><div class="hero">
      <img src="https://cocapn-logos.casey-digennaro.workers.dev/img/cocapn-logo-v1.png" alt="Cocapn" style="width:64px;height:auto;margin-bottom:.5rem;border-radius:8px;display:block;margin-left:auto;margin-right:auto">
      <h1>PersonalLog.ai</h1><p class="tagline">Watch AI hold space for reflection — your thoughts, amplified.</p><div class="fork-btns"><a href="https://github.com/superinstance/personallog-ai" target="_blank">⭐ Star</a><a href="https://github.com/superinstance/personallog-ai/fork" target="_blank">🍴 Fork</a></div></div><div class="demo-section"><div class="demo-label">Live Demo — Reflective Journaling Session</div><div class="chat"><div class="msg user"><div class="avatar">U</div><div class="msg-body"><div class="msg-name">You</div><div class="msg-text">Had a really rough day at work. My presentation got torn apart in the meeting and I just sat there.</div></div></div><div class="msg agent"><div class="avatar">P</div><div class="msg-body"><div class="msg-name">PersonalLog</div><div class="msg-text">That sounds tough. When you say "sat there" — was that a choice, or did something stop you from responding?</div></div></div><div class="msg user"><div class="avatar">U</div><div class="msg-body"><div class="msg-name">You</div><div class="msg-text">I think I froze. It's like my brain just went blank when the criticism started.</div></div></div><div class="msg agent"><div class="avatar">P</div><div class="msg-body"><div class="msg-name">PersonalLog</div><div class="msg-text">Freezing under criticism is really common. It's a stress response, not a character flaw. I notice in your last three entries, you've mentioned feeling "not good enough" after feedback sessions. <span class="label">📋 Pattern detected</span><div class="pattern">You tend to internalize criticism as identity ("I'm not good enough") rather than as information about the work. This pattern shows up most in group settings.</div>What if the feedback was about the slides, not about you?</div></div></div><div class="msg user"><div class="avatar">U</div><div class="msg-body"><div class="msg-name">You</div><div class="msg-text">That… actually makes sense. The slides did have too much text. They said the content was good, just the delivery format.</div></div></div><div class="msg agent"><div class="avatar">P</div><div class="msg-body"><div class="msg-name">PersonalLog</div><div class="msg-text"><span class="label">💡 Coping Strategy</span><br>Next time you get feedback, try the "3-second pause": take a breath, then mentally separate the <em>work</em> from the <em>self</em>. Ask: "What's one specific thing I can improve?" It turns vague criticism into actionable data.<br><br>You're also welcome to write more tonight — I'm here whenever you need to think out loud. 🌙</div></div></div></div></div><div class="byok"><h3>🔑 Bring Your Own Key — Start Journaling</h3><div class="byok-row"><input id="key" placeholder="sk-... your API key" type="password"><button onclick="window.location.href='/setup?key='+document.getElementById('key').value">Start Reflecting →</button></div></div><div class="fork-bar"><h3>⚡ Fork & Deploy</h3><div class="deploy-box"><button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent);this.textContent='Copied!'">Copy</button><code>git clone https://github.com/superinstance/personallog-ai.git
cd personallog-ai
npm install
npx wrangler deploy</code></div></div><div class="footer">PersonalLog.ai — Part of the Cocapn Ecosystem</div></body></html>`;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/') return new Response(landing(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
		const method = request.method;

		if (method === 'OPTIONS') {
			return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } });
		}

		try {
			// ==============================
			// HEALTH CHECK
			// ==============================
			if (path === '/setup' && method === 'GET') {
				return new Response(generateSetupHTML('personallog-ai', '#4f46e5'), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
			}

			// --- Phase 1B: Confidence tracking ---
			if (path === '/api/evaporation' && method === 'GET') { return jsonResponse({ hot: [], warm: [], coverage: 0, repo: 'personallog-ai', timestamp: Date.now() }); }
			if (path === '/api/kg' && method === 'GET') { return jsonResponse({ nodes: [], edges: [], domain: 'personallog-ai', timestamp: Date.now() }); }
			if (path === '/api/memory' && method === 'GET') { return jsonResponse({ patterns: [], repo: 'personallog-ai', timestamp: Date.now() }); }
			if (path === '/api/confidence' && method === 'GET') {
				const tracker = getTracker();
				const saved = await env.PERSONALLOG_MEMORY.get('confidence-state');
				if (saved) tracker.deserialize(saved);
				return jsonResponse(tracker.getAll());
			}
			if (path === '/api/confidence' && method === 'POST') {
				const tracker = getTracker();
				const saved = await env.PERSONALLOG_MEMORY.get('confidence-state');
				if (saved) tracker.deserialize(saved);
				const { topic, success } = await request.json();
				tracker.record(topic, typeof success === 'boolean' ? success : true);
				await env.PERSONALLOG_MEMORY.put('confidence-state', tracker.serialize());
				return jsonResponse(tracker.get(topic));
			}

			if (path === '/api/efficiency' && method === 'GET') { return jsonResponse(await loadStats(env.PERSONALLOG_MEMORY)); }
			if (path === '/api/chat' && method === 'POST') {
				try {
					const body = await request.json();
					const apiKey = (env as any)?.OPENAI_API_KEY || (env as any)?.ANTHROPIC_API_KEY || (env as any)?.GEMINI_API_KEY;
					if (!apiKey) return jsonResponse({ success: false, error: 'No API key configured. Visit /setup.' }, 503);
					const lastMsg = (body.messages?.slice(-1)[0]?.content) || body.message || '';
					const cached = await deadbandCheck(env.PERSONALLOG_MEMORY, lastMsg, 'personallog');
					if (cached) { await recordHit(env.PERSONALLOG_MEMORY); return jsonResponse({ success: true, response: cached.response, fromCache: true }); }

					// Confidence-aware routing
					const tracker = getTracker();
					const router = getRouter();
					const saved = await env.PERSONALLOG_MEMORY.get('confidence-state');
					if (saved) tracker.deserialize(saved);

					const topic = tracker.classify(lastMsg);
					const conf = tracker.get(topic);
					const decision = router.route(topic, conf.score, conf.count);

					const sysContent = `You are PersonalLog.ai, a personal wellness and habit tracking assistant.\n[Model routing: tier ${decision.tier} — ${decision.reason}]`;
					const messages = [{ role: 'system', content: sysContent }, ...(body.messages || [{ role: 'user', content: body.message || '' }])];
					const result = await evapPipeline(env, lastMsg, () => callLLM(apiKey, messages), 'personallog-ai');

					tracker.record(topic, true);
					await env.PERSONALLOG_MEMORY.put('confidence-state', tracker.serialize());
					return jsonResponse({ success: true, response: result.response, source: result.source, tokensUsed: result.tokensUsed, _tier: decision.tier, _topic: topic, _confidence: conf.score });
				} catch (e: any) { return jsonResponse({ success: false, error: e.message }, 500); }
			}
			if (path === '/health' && method === 'GET') {
				return jsonResponse({ status: 'ok', repo: 'personallog-ai', version: '1.1.0', agentCount: 1, modules: ['mood','habits','dreams','goals','wellness','journal','growth','seed'], seedVersion: '2024.04', timestamp: Date.now() });
			}
  if (path === '/vessel.json') { try { const vj = await import('./vessel.json', { with: { type: 'json' } }); return jsonResponse(vj.default || vj); } catch { return jsonResponse({}); } }

			// ==============================
			// SEED ROUTE
			if (path === '/api/seed' && method === 'GET') {
				return jsonResponse({ domain: 'personallog-ai', description: 'Personal intelligence engine — wellness, mood, habits, goals', seedVersion: '2024.04',
					frameworks: ['CBT journaling','mindfulness','positive psychology','habit loop','SMART goals','sleep hygiene','stress management'],
					prompts: ['What are you grateful for today?','How is your energy on a 1-10 scale?','What challenged you?','What did you learn?'],
					systemPrompt: 'You are PersonalLog, a wellness and personal growth companion.' });
			}

			// MOOD ROUTES
			// ==============================
			if (path === '/api/mood' && method === 'POST') {
				const moodGraph = new MoodGraph((await deserializeState(env, 'mood-graph')) || undefined);
				const body = await request.json() as { mood: string; note?: string; energy?: number; tags?: string[] };
				
				if (!body.mood) {
					return jsonResponse({ success: false, error: 'Mood is required' }, 400);
				}

				const entry = moodGraph.logMood(body.mood, body.note, body.energy, body.tags);
				await serializeState(env, 'mood-graph', moodGraph);
				return jsonResponse({ success: true, data: entry }, 201);
			}

			if (path === '/api/mood/history' && method === 'GET') {
				const moodGraph = new MoodGraph((await deserializeState(env, 'mood-graph')) || undefined);
				const history = moodGraph.getHistory();
				const graphData = moodGraph.getGraphData ? moodGraph.getGraphData() : history;
				return jsonResponse({ success: true, data: { history, graphData } });
			}

			// ==============================
			// HABITS ROUTES
			// ==============================
			if (path === '/api/habits' && method === 'POST') {
				const habitEngine = new HabitEngine((await deserializeState(env, 'habit-engine')) || undefined);
				const body = await request.json() as { habit: string; completed: boolean };
				
				if (!body.habit || typeof body.completed === 'undefined') {
					return jsonResponse({ success: false, error: 'Habit name and completed status are required' }, 400);
				}

				const result = body.completed 
					? habitEngine.completeHabit(body.habit) 
					: habitEngine.logHabit(body.habit, body.completed);
				
				await serializeState(env, 'habit-engine', habitEngine);
				return jsonResponse({ success: true, data: result }, 201);
			}

			if (path === '/api/habits' && method === 'GET') {
				const habitEngine = new HabitEngine((await deserializeState(env, 'habit-engine')) || undefined);
				const habits = habitEngine.getAllHabits ? habitEngine.getAllHabits() : habitEngine.getHabits();
				return jsonResponse({ success: true, data: habits });
			}

			// ==============================
			// DREAMS ROUTES
			// ==============================
			if (path === '/api/dreams' && method === 'POST') {
				const dreamJournal = new DreamJournal((await deserializeState(env, 'dream-journal')) || undefined);
				const body = await request.json() as { title: string; description?: string; mood?: string; lucid?: boolean; tags?: string[] };
				
				if (!body.title) {
					return jsonResponse({ success: false, error: 'Dream title is required' }, 400);
				}

				const dream = dreamJournal.logDream(body.title, body.description, body.mood, body.lucid, body.tags);
				await serializeState(env, 'dream-journal', dreamJournal);
				return jsonResponse({ success: true, data: dream }, 201);
			}

			if (path === '/api/dreams' && method === 'GET') {
				const dreamJournal = new DreamJournal((await deserializeState(env, 'dream-journal')) || undefined);
				const dreams = dreamJournal.getRecentDreams ? dreamJournal.getRecentDreams() : dreamJournal.getDreams();
				return jsonResponse({ success: true, data: dreams });
			}

			// ==============================
			// GOALS ROUTES
			// ==============================
			if (path === '/api/goals' && method === 'POST') {
				const goalSystem = new GoalSystem((await deserializeState(env, 'goal-system')) || undefined);
				const body = await request.json() as { id?: string; title: string; description?: string; target?: number; progress?: number };
				
				if (!body.title) {
					return jsonResponse({ success: false, error: 'Goal title is required' }, 400);
				}

				const goal = body.id 
					? goalSystem.updateGoal(body.id, body) 
					: goalSystem.createGoal(body.title, body.description, body.target);
				
				await serializeState(env, 'goal-system', goalSystem);
				return jsonResponse({ success: true, data: goal }, 201);
			}

			if (path === '/api/goals' && method === 'GET') {
				const goalSystem = new GoalSystem((await deserializeState(env, 'goal-system')) || undefined);
				const goals = goalSystem.getAllGoals ? goalSystem.getAllGoals() : goalSystem.getGoals();
				return jsonResponse({ success: true, data: goals });
			}

			// ==============================
			// WELLNESS ROUTES
			// ==============================
			if (path === '/api/wellness' && method === 'POST') {
				const wellnessEngine = new WellnessEngine((await deserializeState(env, 'wellness-engine')) || undefined);
				const body = await request.json() as { sleep?: number; exercise?: number; nutrition?: number; stress?: number };
				
				const check = wellnessEngine.logWellness(body);
				await serializeState(env, 'wellness-engine', wellnessEngine);
				return jsonResponse({ success: true, data: check }, 201);
			}

			if (path === '/api/wellness' && method === 'GET') {
				const wellnessEngine = new WellnessEngine((await deserializeState(env, 'wellness-engine')) || undefined);
				const summary = wellnessEngine.getSummary ? wellnessEngine.getSummary() : wellnessEngine.getStatus();
				return jsonResponse({ success: true, data: summary });
			}

			// ==============================
			// 404 FALLBACK
			// ==============================
			return jsonResponse({ success: false, error: 'Not Found' }, 404);

		} catch (err) {
			return errorHandler(err);
		}
	},
};
