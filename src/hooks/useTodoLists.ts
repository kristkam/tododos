import { useState, useEffect, useCallback } from 'react';
import type { TodoList } from '../types';
import { todoStorage } from '../firebase/storageAdapter';
import { useToast } from './useToast';

export const useTodoLists = () => {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Load initial data and subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = todoStorage.subscribeToLists((updatedLists) => {
      setLists(updatedLists);
      setLoading(false);
      setError(null);
    });

    // Handle subscription errors by falling back to one-time load
    const loadFallback = async () => {
      try {
        const initialLists = await todoStorage.loadLists();
        setLists(initialLists);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lists';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        console.error('Error loading initial data:', err);
        setLoading(false);
      }
    };

    // If subscription fails, fall back to one-time load
    if (!unsubscribe) {
      loadFallback();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showToast]);

  // Create a new list
  const createList = useCallback(async (name: string): Promise<string | null> => {
    try {
      const newList = {
        name,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const listId = await todoStorage.createList(newList);
      showToast(`Created list "${name}"`, 'success');
      return listId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create list';
      showToast(errorMessage, 'error');
      console.error('Error creating list:', err);
      return null;
    }
  }, [showToast]);

  // Update an existing list
  const updateList = useCallback(async (list: TodoList): Promise<boolean> => {
    try {
      const updatedList = {
        ...list,
        updatedAt: new Date()
      };

      await todoStorage.updateList(updatedList);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update list';
      showToast(errorMessage, 'error');
      console.error('Error updating list:', err);
      return false;
    }
  }, [showToast]);

  // Delete a list
  const deleteList = useCallback(async (listId: string, listName: string): Promise<boolean> => {
    try {
      await todoStorage.deleteList(listId);
      showToast(`Deleted list "${listName}"`, 'info');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list';
      showToast(errorMessage, 'error');
      console.error('Error deleting list:', err);
      return false;
    }
  }, [showToast]);

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList
  };
};