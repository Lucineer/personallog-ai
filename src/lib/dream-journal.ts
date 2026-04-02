// src/lib/dream-journal.ts

/**
 * Represents a single dream entry in the journal.
 */
export interface Dream {
  id: string;
  date: number; // Unix timestamp
  title: string;
  description: string;
  mood: string; // e.g., "happy", "anxious", "neutral"
  lucid: boolean;
  recurring: boolean;
  tags: string[];
  characters: string[];
  locations: string[];
  clarity: number; // 1-10 scale
  rating: number; // 1-5 scale (overall experience)
  notes: string;
}

/**
 * Manages dream logging, retrieval, and pattern analysis.
 */
export class DreamJournal {
  private dreams = new Map<string, Dream>();

  constructor(initialDreams: Dream[] = []) {