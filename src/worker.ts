import { WellnessEngine } from './lib/wellness-engine';
import { MoodGraph } from './lib/mood-graph';
import { HabitEngine } from './lib/habit-engine';
import { DreamJournal } from './lib/dream-journal';
import { GoalSystem } from './lib/goal-system';
import { GrowthTracker } from './lib/growth';
import { Journal } from './lib/journal';

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
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>PersonalLog.ai — Your Personal Intelligence Engine</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#0a0a1a;color:#e0e0e0}.hero{background:linear-gradient(135deg,#6366f1,#06b6d4);padding:4rem 2rem;text-align:center}.hero h1{font-size:3rem;background:linear-gradient(90deg,#a5b4fc,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem}.hero p{color:#94a3b8;font-size:1.1rem;max-width:600px;margin:0 auto}.footer{text-align:center;padding:2rem;color:#334;font-size:.8rem;border-top:1px solid #111}</style></head><body>
<div class="hero"><h1>PersonalLog.ai</h1><p>Your Personal Intelligence Engine — mood tracking, dream journaling, habit building, goal setting, and wellness insights.</p></div>
<div class="footer">PersonalLog.ai — Part of the Cocapn Ecosystem</div>
</body></html>`;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/') return new Response(landing(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
		const method = request.method;

		try {
			// ==============================
			// HEALTH CHECK
			// ==============================
			if (path === '/health' && method === 'GET') {
				return jsonResponse({ status: 'ok', repo: 'personallog-ai', modules: ['mood', 'habits', 'dreams', 'goals', 'wellness', 'journal', 'growth'] });
			}

			// ==============================
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
