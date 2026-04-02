// PersonalLog.ai: src/lib/growth.ts
// Measures the gap between your real self and idealized self.

export interface IdealSelf {
  traits: string[];
  goals: string[];
  aspirational: string;
  updatedAt: number;
}

export interface GrowthMetric {
  date: number;
  trait: string;
  currentLevel: number;
  idealLevel: number;
  gap: number;
  evidence: string;
}

export interface BlindSpot {
  pattern: string;
  frequency: number;
  firstSeen: number;
  lastSeen: number;
  examples: string[];
}

export interface Rehearsal {
  id: string;
  scenario: string;
  type: 'social' | 'professional' | 'personal' | 'anxiety';
  idealResponse: string;
  actualResponse?: string;
  feedback?: string;
  createdAt: number;
}

type Trend = 'improving' | 'worsening' | 'stable';

export class GrowthTracker {
  private idealSelf: IdealSelf | null = null;
  private metrics: GrowthMetric[] = [];
  private blindSpots: BlindSpot[] = [];
  private rehearsals: Rehearsal[] = [];

  setIdealSelf(traits: string[], goals: string[], aspirational: string): void {
    this.idealSelf = { traits, goals, aspirational, updatedAt: Date.now() };
  }

  getIdealSelf(): IdealSelf | null {
    return this.idealSelf;
  }

  logMetric(trait: string, currentLevel: number, idealLevel: number, evidence: string): GrowthMetric {
    const metric: GrowthMetric = {
      date: Date.now(),
      trait,
      currentLevel: Math.max(0, Math.min(10, currentLevel)),
      idealLevel: Math.max(0, Math.min(10, idealLevel)),
      gap: idealLevel - currentLevel,
      evidence
    };
    this.metrics.push(metric);
    return metric;
  }

  getTrajectory(days: number = 30): GrowthMetric[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.metrics.filter(m => m.date >= cutoff);
  }

  getGapSummary(): { trait: string; gap: number; trend: Trend }[] {
    const traitMap = new Map<string, GrowthMetric[]>();
    
    for (const m of this.metrics) {
      if (!traitMap.has(m.trait)) traitMap.set(m.trait, []);
      traitMap.get(m.trait)!.push(m);
    }

    const summary: { trait: string; gap: number; trend: Trend }[] = [];
    
    for (const [trait, entries] of traitMap) {
      const sorted = entries.sort((a, b) => a.date - b.date);
      const currentGap = sorted[sorted.length - 1].gap;
      let trend: Trend = 'stable';

      if (sorted.length >= 2) {
        const recent = sorted.slice(-3);
        const older = sorted.slice(0, Math.max(1, sorted.length - 3));
        
        const recentAvgGap = recent.reduce((s, m) => s + m.gap, 0) / recent.length;
        const olderAvgGap = older.reduce((s, m) => s + m.gap, 0) / older.length;
        
        const diff = olderAvgGap - recentAvgGap; // positive means gap is shrinking (improving)
        if (diff > 0.5) trend = 'improving';
        else if (diff < -0.5) trend = 'worsening';
      }

      summary.push({ trait, gap: currentGap, trend });
    }

    return summary.sort((a, b) => b.gap - a.gap); // Largest gaps first
  }

  addBlindSpot(pattern: string, example: string): BlindSpot {
    const existing = this.blindSpots.find(b => b.pattern === pattern);
    
    if (existing) {
      existing.frequency++;
      existing.lastSeen = Date.now();
      existing.examples.push(example);
      return existing;
    }

    const blindSpot: BlindSpot = {
      pattern,
      frequency: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      examples: [example]
    };
    this.blindSpots.push(blindSpot);
    return blindSpot;
  }

  getBlindSpots(): BlindSpot[] {
    return [...this.blindSpots].sort((a, b) => b.frequency - a.frequency);
  }

  createRehearsal(scenario: string, type: Rehearsal['type']): Rehearsal {
    const id = `rsh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    
    // Generates a basic scaffolded ideal response based on the scenario type
    const idealResponse = this.generateIdealResponse(scenario, type);
    
    const rehearsal: Rehearsal = {
      id,
      scenario,
      type,
      idealResponse,
      createdAt: Date.now()
    };
    
    this.rehearsals.push(rehearsal);
    return rehearsal;
  }

  completeRehearsal(id: string, actualResponse: string): { feedback: string } {
    const rehearsal = this.rehearsals.find(r => r.id === id);
    if (!rehearsal) {
      return { feedback: "Rehearsal not found. The scenario may have been lost in the void." };
    }

    rehearsal.actualResponse = actualResponse;
    
    // Simple local feedback generation based on word count comparison
    const idealWords = rehearsal.idealResponse.toLowerCase().split(/\s+/);
    const actualWords = actualResponse.toLowerCase().split(/\s+/);
    
    const isShort = actualWords.length < idealWords.length * 0.5;
    const isLong = actualWords.length > idealWords.length * 1.5;
    
    if (actualResponse.trim().length === 0) {
      rehearsal.feedback = "Silence is sometimes the right answer, but practice requires words. Try engaging with the scenario.";
    } else if (isShort) {
      rehearsal.feedback = `Your response was significantly shorter than your ideal. Your ideal self might elaborate more on intentions and boundaries. You have the space to take up room.`;
    } else if (isLong) {
      rehearsal.feedback = `Your response was quite expansive. Sometimes brevity carries more weight. Consider what is essential to express and what is padding.`;
    } else {
      rehearsal.feedback = `Solid engagement with the scenario. Look at where your response diverges from your ideal—is the gap in tone, content, or courage?`;
    }

    return { feedback: rehearsal.feedback };
  }

  getRehearsals(): Rehearsal[] {
    return [...this.rehearsals];
  }

  serialize(): string {
    return JSON.stringify({
      idealSelf: this.idealSelf,
      metrics: this.metrics,
      blindSpots: this.blindSpots,
      rehearsals: this.rehearsals
    });
  }

  deserialize(json: string): void {
    const data = JSON.parse(json);
    this.idealSelf = data.idealSelf || null;
    this.metrics = data.metrics || [];
    this.blindSpots = data.blindSpots || [];
    this.rehearsals = data.rehearsals || [];
  }

  private generateIdealResponse(scenario: string, type: Rehearsal['type']): string {
    const prompts: Record<Rehearsal['type'], string> = {
      social: "Listen first. Then speak with warmth and honesty, without apologizing for having needs or opinions.",
      professional: "Be direct. State what you think and what you need. Avoid hedging or minimizing your contribution.",
      personal: "Protect your boundaries. You can be gentle and firm at the same time.",
      anxiety: "Stay present. Focus on what is actually happening, not what you fear might happen."
    };
    return prompts[type] || prompts.personal;
  }
}