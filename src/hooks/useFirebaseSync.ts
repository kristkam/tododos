import { useState, useEffect, useCallback } from 'react';
import type { TodoList } from '../types';
import { storageAdapter } from '../firebase/storageAdapter';
import { useToast } from './useToast';

export const useFirebaseSync = () => {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const initialLists = await storageAdapter.loadLists();
        setLists(initialLists);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lists';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [showToast]);

  // Subscribe to real-time updates if using Firebase
  useEffect(() => {
    if (storageAdapter.subscribeToLists) {
      const unsubscribe = storageAdapter.subscribeToLists((updatedLists) => {
        setLists(updatedLists);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // Create a new list
  const createList = useCallback(async (name: string): Promise<string | null> => {
    try {
      const newList = {
        name,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const listId = await storageAdapter.createList(newList);
      
      // For localStorage, we need to update the local state
      // For Firebase, the subscription will handle the update
      if (!storageAdapter.subscribeToLists) {
        const fullList: TodoList = { ...newList, id: listId };
        setLists(prev => [...prev, fullList]);
      }

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

      await storageAdapter.updateList(updatedList);
      
      // For localStorage, we need to update the local state
      // For Firebase, the subscription will handle the update
      if (!storageAdapter.subscribeToLists) {
        setLists(prev => prev.map(l => l.id === list.id ? updatedList : l));
      }

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
      await storageAdapter.deleteList(listId);
      
      // For localStorage, we need to update the local state
      // For Firebase, the subscription will handle the update
      if (!storageAdapter.subscribeToLists) {
        setLists(prev => prev.filter(l => l.id !== listId));
      }

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