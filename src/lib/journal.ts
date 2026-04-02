export interface JournalEntry {
  id: string; date: string; content: string; mood: number; tags: string[];
  aiInsights: string[]; isPrivate: boolean; createdAt: number;
}

export interface Reflection {
  id: string; period: 'daily' | 'weekly' | 'monthly'; startDate: number; endDate: number;
  themes: string[]; moodTrajectory: number[]; highlights: string[]; challenges: string[];
  aiSummary: string; growthNotes: string[];
}

export interface MoodEntry { date: string; mood: number; energy: number; focus: number; notes: string }

export class JournalSystem {
  private entries: JournalEntry[] = [];
  private reflections: Reflection[] = [];
  private moodLog: MoodEntry[] = [];

  private uid(): string { return Math.random().toString(36).slice(2, 11) + Date.now().toString(36); }

  addEntry(content: string, mood: number, tags: string[], isPrivate = false): JournalEntry {
    const entry: JournalEntry = { id: this.uid(), date: new Date().toISOString().split('T')[0], content, mood, tags, aiInsights: [], isPrivate, createdAt: Date.now() };
    this.entries.push(entry);
    return entry;
  }

  getEntries(dateRange?: { start: string; end: string }, tags?: string[]): JournalEntry[] {
    let result = [...this.entries];
    if (dateRange) result = result.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);
    if (tags?.length) result = result.filter(e => tags.some(t => e.tags.includes(t)));
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  getEntry(id: string): JournalEntry | undefined { return this.entries.find(e => e.id === id); }

  logMood(mood: number, energy: number, focus: number, notes = ''): MoodEntry {
    const entry: MoodEntry = { date: new Date().toISOString().split('T')[0], mood, energy, focus, notes };
    this.moodLog.push(entry);
    return entry;
  }

  getMoodHistory(days: number): MoodEntry[] {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    return this.moodLog.filter(m => new Date(m.date) >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  }

  getMoodAverage(days: number): number {
    const history = this.getMoodHistory(days);
    return history.length ? history.reduce((s, m) => s + m.mood, 0) / history.length : 0;
  }

  generateReflection(period: 'daily' | 'weekly' | 'monthly'): Reflection {
    const now = new Date();
    let start: Date;
    if (period === 'daily') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'weekly') { start = new Date(now); start.setDate(now.getDate() - 7); }
    else { start = new Date(now); start.setMonth(now.getMonth() - 1); }

    const startMs = start.getTime();
    const periodEntries = this.entries.filter(e => e.createdAt >= startMs);
    const moodTrajectory = periodEntries.map(e => e.mood);
    const tagCount: Record<string, number> = {};
    periodEntries.forEach(e => e.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
    const themes = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
    
    const sorted = [...periodEntries].sort((a, b) => b.mood - a.mood);
    const highlights = sorted.slice(0, 3).map(e => e.content.slice(0, 100));
    const challenges = sorted.slice(-3).reverse().map(e => e.content.slice(0, 100));

    const avgMood = moodTrajectory.length ? moodTrajectory.reduce((a, b) => a + b, 0) / moodTrajectory.length : 5;
    const aiSummary = `Over this ${period} period, you logged ${periodEntries.length} entries with an average mood of ${avgMood.toFixed(1)}/10. ${themes.length ? `Key themes: ${themes.join(', ')}.` : ''}`;
    const growthNotes = avgMood >= 7 ? ['Strong positive trend observed. Keep up current practices.'] : avgMood <= 4 ? ['Challenging period detected. Consider self-care strategies.'] : ['Steady progress maintained. Reflect on small improvements.'];

    const reflection: Reflection = { id: this.uid(), period, startDate: startMs, endDate: Date.now(), themes, moodTrajectory, highlights, challenges, aiSummary, growthNotes };
    this.reflections.push(reflection);
    return reflection;
  }

  getStreak(): number {
    const uniqueDates = [...new Set(this.entries.map(e => e.date))].sort().reverse();
    if (!uniqueDates.length) return 0;
    let streak = 0;
    const check = new Date();
    if (uniqueDates[0] !== check.toISOString().split('T')[0]) { check.setDate(check.getDate() - 1); }
    
    for (let i = 0; i < 365; i++) {
      const ds = check.toISOString().split('T')[0];
      if (uniqueDates.includes(ds)) { streak++; check.setDate(check.getDate() - 1); } 
      else break;
    }
    return streak;
  }

  searchEntries(query: string): JournalEntry[] {
    const q = query.toLowerCase();
    return this.entries.filter(e => e.content.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q)));
  }

  getTags(): { tag: string; count: number }[] {
    const counts: Record<string, number> = {};
    this.entries.forEach(e => e.tags.forEach(t => counts[t] = (counts[t] || 0) + 1));
    return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  }

  getEntryCount(): number { return this.entries.length; }

  exportMarkdown(dateRange?: { start: string; end: string }): string {
    const entries = this.getEntries(dateRange);
    let md = `# PersonalLog.ai Export\n\nExported ${new Date().toISOString()} containing ${entries.length} entries.\n\n---\n\n`;
    entries.forEach(e => {
      md += `## ${e.date} ${e.isPrivate ? '🔒' : ''}\n**Mood:** ${e.mood}/10\n**Tags:** ${e.tags.join(', ') || 'None'}\n\n${e.content}\n\n`;
      if (e.aiInsights.length) md += `> **AI Insights:** ${e.aiInsights.join('; ')}\n\n`;
      md += '---\n\n';
    });
    return md;
  }

  serialize(): string { return JSON.stringify({ entries: this.entries, reflections: this.reflections, moodLog: this.moodLog }); }

  deserialize(json: string): void {
    try {
      const data = JSON.parse(json);
      this.entries = data.entries || [];
      this.reflections = data.reflections || [];
      this.moodLog = data.moodLog || [];
    } catch (e) { console.error('Failed to deserialize journal data:', e); }
  }
}