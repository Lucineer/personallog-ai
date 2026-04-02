// src/lib/goal-system.ts

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline?: number;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  milestones: Array<{ title: string; target: number; achieved: boolean }>;
  notes: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  completedAt?: number;
}

export class GoalSystem {
  private goals = new Map<string, Goal>();

  addGoal(goal: Goal): Goal { this.goals.set(goal.id, goal); return goal; }
  getGoal(id: string): Goal | undefined { return this.goals.get(id); }
  getAllGoals(): Goal[] { return [...this.goals.values()]; }
  updateProgress(id: string, progress: number): Goal | undefined {
    const g = this.goals.get(id);
    if (g) { g.progress = Math.min(100, Math.max(0, progress)); if (g.progress >= 100) { g.status = 'completed'; g.completedAt = Date.now(); } }
    return g;
  }
  deleteGoal(id: string): boolean { return this.goals.delete(id); }
}
