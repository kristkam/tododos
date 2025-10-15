import type { TodoList } from './types';

const STORAGE_KEY = 'tododos-lists';

export const saveListsToStorage = (lists: TodoList[]): void => {
  try {
    const serializedLists = JSON.stringify(lists, (_key, value) => {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    localStorage.setItem(STORAGE_KEY, serializedLists);
  } catch (error) {
    console.error('Failed to save lists to localStorage:', error);
  }
};

export const loadListsFromStorage = (): TodoList[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    
    // Convert ISO strings back to Date objects
    return parsed.map((list: {
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
      items: Array<{
        id: string;
        text: string;
        completed: boolean;
        createdAt: string;
      }>;
    }) => ({
      ...list,
      createdAt: new Date(list.createdAt),
      updatedAt: new Date(list.updatedAt),
      items: list.items.map((item: {
        id: string;
        text: string;
        completed: boolean;
        createdAt: string;
      }) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }))
    }));
  } catch (error) {
    console.error('Failed to load lists from localStorage:', error);
    return [];
  }
};

export const saveCurrentListIdToStorage = (listId: string | null): void => {
  try {
    if (listId) {
      localStorage.setItem('tododos-current-list', listId);
    } else {
      localStorage.removeItem('tododos-current-list');
    }
  } catch (error) {
    console.error('Failed to save current list ID:', error);
  }
};

export const loadCurrentListIdFromStorage = (): string | null => {
  try {
    return localStorage.getItem('tododos-current-list');
  } catch (error) {
    console.error('Failed to load current list ID:', error);
    return null;
  }
};