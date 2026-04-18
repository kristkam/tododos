import type { GroupingScheme } from '../types';
import { groupingFirebaseService } from './groupingService';

export type GroupingStorage = {
  loadSchemes(): Promise<GroupingScheme[]>;
  createScheme(scheme: Omit<GroupingScheme, 'id'>): Promise<string>;
  updateScheme(scheme: GroupingScheme): Promise<void>;
  deleteScheme(schemeId: string): Promise<void>;
  subscribeToSchemes(callback: (schemes: GroupingScheme[]) => void): () => void;
};

export const groupingStorage: GroupingStorage = {
  async loadSchemes(): Promise<GroupingScheme[]> {
    return await groupingFirebaseService.getSchemes();
  },

  async createScheme(scheme: Omit<GroupingScheme, 'id'>): Promise<string> {
    return await groupingFirebaseService.createScheme(scheme);
  },

  async updateScheme(scheme: GroupingScheme): Promise<void> {
    return await groupingFirebaseService.updateScheme(scheme);
  },

  async deleteScheme(schemeId: string): Promise<void> {
    return await groupingFirebaseService.deleteScheme(schemeId);
  },

  subscribeToSchemes(callback: (schemes: GroupingScheme[]) => void): () => void {
    return groupingFirebaseService.subscribeToSchemes(callback);
  },
};
