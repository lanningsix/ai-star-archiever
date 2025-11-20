
export enum TaskCategory {
  LIFE = '生活习惯',
  BEHAVIOR = '行为习惯',
  BONUS = '加分项',
  PENALTY = '减分项'
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  stars: number; // Can be positive or negative
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string; // Emoji or Lucide icon name
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  completedTaskIds: string[];
  timestamp: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Positive (earned) or Negative (spent)
  type: 'EARN' | 'SPEND' | 'PENALTY';
}

// Added Pet interface to satisfy cloud.ts import
export interface Pet {
  name: string;
  level: number;
  experience: number;
  lastInteracted: number;
}

export interface AppState {
  tasks: Task[];
  rewards: Reward[];
  logs: Record<string, string[]>; // date -> array of task IDs
  balance: number;
  transactions: Transaction[];
}
