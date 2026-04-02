// src/lib/dream-journal.ts

export interface Dream {
  id: string;
  date: number;
  title: string;
  description: string;
  mood: string;
  lucid: boolean;
  recurring: boolean;
  tags: string[];
  characters: string[];
  locations: string[];
  clarity: number;
  rating: number;
  notes: string;
}

export class DreamJournal {
  private dreams = new Map<string, Dream>();

  constructor(initialDreams: Dream[] = []) {
    for (const d of initialDreams) this.dreams.set(d.id, d);
  }

  addDream(dream: Dream): Dream { this.dreams.set(dream.id, dream); return dream; }
  getDream(id: string): Dream | undefined { return this.dreams.get(id); }
  getAllDreams(): Dream[] { return [...this.dreams.values()]; }
  deleteDream(id: string): boolean { return this.dreams.delete(id); }
  getByDateRange(start: number, end: number): Dream[] {
    return [...this.dreams.values()].filter(d => d.date >= start && d.date <= end);
  }
  getPatterns(): { recurringThemes: string[]; topMoods: string[] } {
    const moods: Record<string, number> = {};
    for (const d of this.dreams.values()) moods[d.mood] = (moods[d.mood] || 0) + 1;
    return { recurringThemes: [], topMoods: Object.entries(moods).sort((a, b) => b[1] - a[1]).map(([m]) => m) };
  }
}
