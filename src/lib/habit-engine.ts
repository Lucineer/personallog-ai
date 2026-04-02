// src/lib/habit-engine.ts

interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  entries: Array<{ date: number; value: number; note: string }>;
  color: string;
  streak: number;
  bestStreak: number;
  createdAt: number;
}

export class HabitEngine {
  private habits = new Map<string, Habit>();

  private _getStartOfDay(timestamp: number): number {
    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  addHabit(habit: Habit): Habit { this.habits.set(habit.id, habit); return habit; }
  getHabit(id: string): Habit | undefined { return this.habits.get(id); }
  getAllHabits(): Habit[] { return [...this.habits.values()]; }
  logEntry(id: string, value: number, note: string = ''): Habit | undefined {
    const h = this.habits.get(id);
    if (h) { h.entries.push({ date: this._getStartOfDay(Date.now()), value, note }); h.streak++; if (h.streak > h.bestStreak) h.bestStreak = h.streak; }
    return h;
  }
  deleteHabit(id: string): boolean { return this.habits.delete(id); }
}
