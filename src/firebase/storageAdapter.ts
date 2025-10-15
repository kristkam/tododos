import type { TodoList } from '../types';
import { firebaseService } from './todoService';

// Storage adapter that can switch between localStorage and Firebase
export interface StorageAdapter {
  loadLists(): Promise<TodoList[]>;
  saveLists(lists: TodoList[]): Promise<void>;
  createList(list: Omit<TodoList, 'id'>): Promise<string>;
  updateList(list: TodoList): Promise<void>;
  deleteList(listId: string): Promise<void>;
  subscribeToLists?(callback: (lists: TodoList[]) => void): () => void;
}

// Firebase storage adapter
export const firebaseStorageAdapter: StorageAdapter = {
  async loadLists(): Promise<TodoList[]> {
    return await firebaseService.getLists();
  },

  async saveLists(lists: TodoList[]): Promise<void> {
    // For Firebase, we don't need to save all lists at once
    // Individual operations (create, update, delete) handle persistence
    console.log('Firebase adapter: saveLists called with', lists.length, 'lists');
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

// Local storage adapter (your existing implementation)
export const localStorageAdapter: StorageAdapter = {
  async loadLists(): Promise<TodoList[]> {
    const { loadListsFromStorage } = await import('../storage');
    return loadListsFromStorage();
  },

  async saveLists(lists: TodoList[]): Promise<void> {
    const { saveListsToStorage } = await import('../storage');
    saveListsToStorage(lists);
  },

  async createList(list: Omit<TodoList, 'id'>): Promise<string> {
    // For localStorage, we generate the ID locally
    const newList: TodoList = {
      ...list,
      id: crypto.randomUUID()
    };
    const currentLists = await this.loadLists();
    await this.saveLists([...currentLists, newList]);
    return newList.id;
  },

  async updateList(list: TodoList): Promise<void> {
    const currentLists = await this.loadLists();
    const updatedLists = currentLists.map(l => l.id === list.id ? list : l);
    await this.saveLists(updatedLists);
  },

  async deleteList(listId: string): Promise<void> {
    const currentLists = await this.loadLists();
    const filteredLists = currentLists.filter(l => l.id !== listId);
    await this.saveLists(filteredLists);
  }
};

// Configuration for which adapter to use
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

// Export the current storage adapter
export const storageAdapter: StorageAdapter = USE_FIREBASE 
  ? firebaseStorageAdapter 
  : localStorageAdapter;