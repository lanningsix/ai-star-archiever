
import { CLOUD_API_URL } from '../constants';
import { AppState, Task, Reward, Transaction } from '../types';

export interface CloudData {
  tasks: Task[];
  rewards: Reward[];
  logs: Record<string, string[]>;
  balance: number;
  transactions: Transaction[];
  themeKey: string;
  userName: string;
  lastUpdated: number;
}

export type DataScope = 'tasks' | 'rewards' | 'settings' | 'activity';

export const cloudService = {
  // Generate a random Family ID
  generateFamilyId: () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  // Load data from Backend (Aggregated)
  loadData: async (familyId: string): Promise<CloudData | null> => {
    if (CLOUD_API_URL.includes('example')) {
        console.warn('Cloud Sync Skipped: API URL is not configured in constants.ts');
        return null;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(`${CLOUD_API_URL}?familyId=${familyId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Network response was not ok');
      
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("Failed to load cloud data:", error);
      throw error;
    }
  },

  // Save data to Backend (Scoped)
  saveData: async (familyId: string, scope: DataScope, data: any): Promise<boolean> => {
    if (CLOUD_API_URL.includes('example')) {
        return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }
    try {
      const payload = {
        scope,
        data,
        lastUpdated: Date.now()
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for save

      const response = await fetch(`${CLOUD_API_URL}?familyId=${familyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      return response.ok;
    } catch (error) {
      console.error(`Failed to save cloud data (${scope}):`, error);
      return false;
    }
  }
};
