import type { TodoList } from '../types';
import { firebaseService } from './todoService';

// Simplified Firebase-only storage interface
export interface TodoStorage {
  loadLists(): Promise<TodoList[]>;
  createList(list: Omit<TodoList, 'id'>): Promise<string>;
  updateList(list: TodoList): Promise<void>;
  deleteList(listId: string): Promise<void>;
  subscribeToLists(callback: (lists: TodoList[]) => void): () => void;
}

// Firebase storage implementation
export const todoStorage: TodoStorage = {
  async loadLists(): Promise<TodoList[]> {
    return await firebaseService.getLists();
  },

  async createList(list: Omit<TodoList, 'id'>): Promise<string> {
    return await firebaseService.createList(list);
  },

  async updateList(list: TodoList): Promise<void> {
    return await firebaseService.updateList(list);
  },

  async deleteList(listId: string): Promise<void> {
    return await firebaseService.deleteList(listId);
  },

  subscribeToLists(callback: (lists: TodoList[]) => void): () => void {
    return firebaseService.subscribeToLists(callback);
  }
};