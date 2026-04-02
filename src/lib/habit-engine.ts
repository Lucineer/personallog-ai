import { v4 as uuidv4 } from 'uuid'; // Using uuid for robust ID generation

// Define the Habit interface as provided
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

  // --- Private Date Utility Methods ---
  private _getStartOfDay(timestamp: number): number {
    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);
    return d.getTime();