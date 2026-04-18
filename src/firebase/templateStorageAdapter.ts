import type { ListTemplate } from '../types';
import { templateFirebaseService } from './templateService';

export type TemplateStorage = {
  loadTemplates(): Promise<ListTemplate[]>;
  createTemplate(template: Omit<ListTemplate, 'id'>): Promise<string>;
  updateTemplate(template: ListTemplate): Promise<void>;
  deleteTemplate(templateId: string): Promise<void>;
  subscribeToTemplates(callback: (templates: ListTemplate[]) => void): () => void;
};

export const templateStorage: TemplateStorage = {
  async loadTemplates(): Promise<ListTemplate[]> {
    return await templateFirebaseService.getTemplates();
  },

  async createTemplate(template: Omit<ListTemplate, 'id'>): Promise<string> {
    return await templateFirebaseService.createTemplate(template);
  },

  async updateTemplate(template: ListTemplate): Promise<void> {
    return await templateFirebaseService.updateTemplate(template);
  },

  async deleteTemplate(templateId: string): Promise<void> {
    return await templateFirebaseService.deleteTemplate(templateId);
  },

  subscribeToTemplates(callback: (templates: ListTemplate[]) => void): () => void {
    return templateFirebaseService.subscribeToTemplates(callback);
  },
};
