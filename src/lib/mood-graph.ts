/**
 * @file src/lib/mood-graph.ts
 * @description Mood visualization and pattern analysis for PersonalLog.ai
 */

/**
 * Interface for a single mood entry.
 * - `date`: Timestamp in milliseconds.
 * - `mood`: Overall mood score (e.g., 0-10).
 * - `energy`: Energy level (e.g., 0-10).
 * - `anxiety`: Anxiety level (e.g., 0-10).
 * - `sleep`: Hours of sleep.
 * - `note`: Optional text note.
 * - `tags`: Array of associated tags.
 */
export interface MoodEntry {
  date: number;
  mood: number;
  energy: number;
  anxiety: number;
  sleep: number;
  note: string;
  tags: string[];
}