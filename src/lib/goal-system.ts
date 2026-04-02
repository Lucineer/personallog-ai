// src/lib/goal-system.ts

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline?: number; // Unix timestamp (milliseconds)
  progress: number; // 0-100
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  milestones: Array<{ title: string; target: number; achieved: boolean }>; // target is a progress percentage
  notes: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number; // Unix timestamp (milliseconds)
  completedAt?: number; // Unix timestamp (milliseconds)
}

export class GoalSystem {
  private goals = new Map