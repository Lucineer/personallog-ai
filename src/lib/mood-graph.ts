// src/lib/mood-graph.ts

export interface MoodEntry {
  date: number;
  mood: number;
  energy: number;
  anxiety: number;
  sleep: number;
  note: string;
  tags: string[];
}

export class MoodGraph {
  private entries: MoodEntry[] = [];

  addEntry(entry: MoodEntry): MoodEntry { this.entries.push(entry); return entry; }
  getAll(): MoodEntry[] { return this.entries; }
  getAverage(field: keyof MoodEntry = 'mood'): number {
    if (this.entries.length === 0) return 0;
    const vals = this.entries.map(e => e[field]).filter((v): v is number => typeof v === 'number');
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  getTrend(days: number = 7): 'improving' | 'declining' | 'stable' {
    const recent = this.entries.slice(-days);
    if (recent.length < 2) return 'stable';
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const avg = (arr: MoodEntry[]) => arr.reduce((s, e) => s + e.mood, 0) / arr.length;
    const diff = avg(secondHalf) - avg(firstHalf);
    return diff > 0.5 ? 'improving' : diff < -0.5 ? 'declining' : 'stable';
  }
}
