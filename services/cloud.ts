

import { CLOUD_API_URL } from '../constants';
import { AppState, Task, Reward, Transaction } from '../types';

export interface CloudData {
  tasks?: Task[];
  rewards?: Reward[];
  logs?: Record<string, string[]>;
  balance: number;
  transactions?: Transaction[];
  themeKey: string;
  userName: string;
  lastUpdated?: number;
}

export type DataScope = 'tasks' | 'rewards' | 'settings' | 'activity';

export const cloudService = {
  // Generate a random Family ID
  generateFamilyId: () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  // Load data from Backend (Aggregated or Scoped)
  loadData: async (familyId: string, scope: string = 'all'): Promise<CloudData | null> => {
    if (CLOUD_API_URL.includes('example')) {
        console.warn('Cloud Sync Skipped: API URL is not configured in constants.ts');
        return null;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      // Append scope parameter
      const response = await fetch(`${CLOUD_API_URL}?familyId=${familyId}&scope=${scope}`, {
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

  // Save data to Backend (Scoped) with Retry
  saveData: async (familyId: string, scope: DataScope, data: any): Promise<boolean> => {
    if (CLOUD_API_URL.includes('example')) {
        return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }

    const payload = {
        scope,
        data,
        lastUpdated: Date.now()
    };

    // Retry logic (3 attempts)
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000 + (attempt * 1000)); // Increasing timeout

          const response = await fetch(`${CLOUD_API_URL}?familyId=${familyId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          if (response.ok) return true;
          
          // If server returns error, wait before retry
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        } catch (error) {
          console.warn(`Failed to save cloud data (${scope}), attempt ${attempt + 1}:`, error);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
    }
    
    console.error(`Failed to save cloud data (${scope}) after 3 attempts.`);
    return false;
  }
};