import React from 'react';

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

// Avatar Types
export type AvatarPartType = 'head' | 'face' | 'body' | 'back' | 'hand' | 'skin';

export interface AvatarItem {
  id: string;
  type: AvatarPartType;
  name: string;
  cost: number;
  icon: string; // Emoji for shop
  svgContent?: (props: any) => React.ReactElement; // Render function
  color?: string;
}

export interface AvatarConfig {
  skinColor: string;
  head?: string; // itemId
  face?: string;
  body?: string;
  back?: string;
  hand?: string;
}

export interface AvatarState {
  config: AvatarConfig;
  ownedItems: string[];
}

export interface AppState {
  tasks: Task[];
  rewards: Reward[];
  logs: Record<string, string[]>; // date -> array of task IDs
  balance: number;
  transactions: Transaction[];
  avatar: AvatarState;
}