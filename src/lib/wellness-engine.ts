interface MoodEntry { id: string; ts: number; score: number; energy: number; stress: number; tags: string[]; note: string }
interface JournalEntry { id: string; ts: number; content: string; mood: number; tags: string[] }
interface Habit { id: string; name: string; cat: string; target: number; current: number; streak: number; best: number; last: number }
interface Goal { id: string; title: string; progress: number; due: number; priority: string; status: string }
const uid = () => crypto.randomUUID();
const dayMs = 86400000;
const dayStr = (ts: number) => new Date(ts).toISOString().split('T')[0];
export class WellnessEngine {
  private moods: MoodEntry[] = [];
  private journals: JournalEntry[] = [];
  private habits = new Map<string, Habit>();
  private goals = new Map<string, Goal>();
  logMood(score: number, energy: number, stress: number, note: string, tags: string[]): MoodEntry {
    const e: MoodEntry = { id: uid(), ts: Date.now(), score, energy, stress, note, tags }; this.moods.push(e); return e;
  }
  getMoodTrend(days: number): Array<{ date: string; avg: number; energy: number }> {
    const cutoff = Date.now() - days * dayMs;
    const byDay = new Map<string, MoodEntry[]>();
    for (const m of this.moods) { if (m.ts >= cutoff) { const d = dayStr(m.ts); byDay.set(d, [...(byDay.get(d) || []), m]); } }
    return [...byDay.entries()].map(([date, entries]) => ({
      date, avg: entries.reduce((s, e) => s + e.score, 0) / entries.length,
      energy: entries.reduce((s, e) => s + e.energy, 0) / entries.length,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
  getMoodAvg(days: number): number {
    const recent = this.moods.filter(m => m.ts >= Date.now() - days * dayMs);
    return recent.length ? recent.reduce((s, m) => s + m.score, 0) / recent.length : 5;
  }
  addJournal(content: string, tags: string[]): JournalEntry {
    const e: JournalEntry = { id: uid(), ts: Date.now(), content, mood: this.getMoodAvg(1), tags }; this.journals.push(e); return e;
  }
  getJournals(days: number): JournalEntry[] {
    return this.journals.filter(j => j.ts >= Date.now() - days * dayMs).sort((a, b) => b.ts - a.ts);
  }
  searchJournals(query: string): JournalEntry[] {
    const q = query.toLowerCase();
    return this.journals.filter(j => j.content.toLowerCase().includes(q) || j.tags.some(t => t.includes(q)));
  }
  getJournalStreak(): number {
    const days = new Set(this.journals.map(j => dayStr(j.ts)));
    let streak = 0, d = Date.now();
    while (days.has(dayStr(d))) { streak++; d -= dayMs; }
    return streak;
  }
  getTopTags(days: number, n: number): Array<{ tag: string; count: number }> {
    const counts = new Map<string, number>();
    for (const j of this.journals) { if (j.ts >= Date.now() - days * dayMs) for (const t of j.tags) counts.set(t, (counts.get(t) || 0) + 1); }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([tag, count]) => ({ tag, count }));
  }
  createHabit(name: string, cat: string, target: number): Habit {
    const h: Habit = { id: uid(), name, cat, target, current: 0, streak: 0, best: 0, last: 0 };
    this.habits.set(h.id, h); return h;
  }
  logHabit(id: string, amount: number): void {
    const h = this.habits.get(id); if (!h) return;
    h.current += amount;
    if (dayStr(h.last) !== dayStr(Date.now())) {
      h.streak = dayStr(h.last) === dayStr(Date.now() - dayMs) ? h.streak + 1 : 1;
    }
    h.last = Date.now();
    if (h.streak > h.best) h.best = h.streak;
  }
  getHabits(): Habit[] { return [...this.habits.values()]; }
  getTodayHabits(): Array<{ habit: Habit; done: boolean }> {
    const today = dayStr(Date.now());
    return this.getHabits().map(h => ({ habit: h, done: dayStr(h.last) === today && h.current >= h.target }));
  }
  createGoal(title: string, due: number, priority: string): Goal {
    const g: Goal = { id: uid(), title, progress: 0, due, priority, status: 'active' };
    this.goals.set(g.id, g); return g;
  }
  updateGoal(id: string, progress: number): void {
    const g = this.goals.get(id); if (!g) return;
    g.progress = Math.min(100, Math.max(0, progress));
    if (g.progress >= 100) g.status = 'completed';
  }
  getActiveGoals(): Goal[] { return [...this.goals.values()].filter(g => g.status === 'active'); }
  getOverdueGoals(): Goal[] { return [...this.goals.values()].filter(g => g.status === 'active' && g.due < Date.now()); }
  getWeeklyDigest(): string {
    const lines = ['Weekly Digest', ''];
    const trend = this.getMoodTrend(7);
    if (trend.length >= 2) {
      const diff = trend[trend.length - 1].avg - trend[0].avg;
      lines.push(`Mood: ${diff > 0.5 ? 'Improving' : diff < -0.5 ? 'Declining' : 'Stable'}`);
    }
    const streak = this.getJournalStreak();
    if (streak > 0) lines.push(`Journal streak: ${streak} days`);
    const habits = this.getHabits();
    const best = habits.reduce((b, h) => h.streak > b.streak ? h : b, habits[0]);
    if (best?.streak > 0) lines.push(`Top habit: ${best.name} (${best.streak} days)`);
    const overdue = this.getOverdueGoals();
    if (overdue.length) lines.push(`Overdue: ${overdue.map(g => g.title).join(', ')}`);
    lines.push(`Wellness: ${this.getWellnessScore(7)}/100`);
    return lines.join('\n');
  }
  getWellnessScore(days: number): number {
    const mood = this.getMoodAvg(days) * 10;
    const journal = Math.min(7, this.getJournalStreak()) / 7 * 100;
    const habits = this.getHabits();
    const habit = habits.length ? habits.filter(h => dayStr(h.last) === dayStr(Date.now())).length / habits.length * 100 : 50;
    const goals = this.getActiveGoals();
    const goal = goals.length ? goals.reduce((s, g) => s + g.progress, 0) / goals.length : 50;
    return Math.round(mood * 0.4 + journal * 0.2 + habit * 0.2 + goal * 0.2);
  }
  serialize(): string { return JSON.stringify({ moods: this.moods, journals: this.journals, habits: [...this.habits.values()], goals: [...this.goals.values()] }); }
  deserialize(data: string): void {
    const d = JSON.parse(data);
    this.moods = d.moods || []; this.journals = d.journals || [];
    this.habits = new Map((d.habits || []).map((h: Habit) => [h.id, h]));
    this.goals = new Map((d.goals || []).map((g: Goal) => [g.id, g]));
  }
}
