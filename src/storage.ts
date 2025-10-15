// Utility functions for storing current list ID in localStorage
// This is kept separate from Firestore as it's UI state, not data

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