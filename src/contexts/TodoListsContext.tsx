import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { TodoItem, TodoList } from '../types';
import { todoStorage } from '../firebase/storageAdapter';
import { useToast } from '../hooks/useToast';

export type CreateListOptions = {
  seedItems?: TodoItem[];
  activeGroupingId?: string;
};

export type TodoListsContextValue = {
  lists: TodoList[];
  loading: boolean;
  error: string | null;
  createList: (name: string, options?: CreateListOptions) => Promise<string | null>;
  updateList: (list: TodoList) => Promise<boolean>;
  deleteList: (listId: string, listName: string) => Promise<boolean>;
  /**
   * Clear `activeGroupingId` + `groupOrder` on every list that references the given scheme.
   * Returns the names of affected lists, in list order.
   */
  clearActiveGroupingForScheme: (schemeId: string) => Promise<readonly string[]>;
};

export const TodoListsContext = createContext<TodoListsContextValue | undefined>(undefined);

type TodoListsProviderProps = {
  children: ReactNode;
};

export function TodoListsProvider({ children }: TodoListsProviderProps): ReactElement {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  const listsRef = useRef<TodoList[]>([]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    const unsubscribe = todoStorage.subscribeToLists((updatedLists) => {
      setLists(updatedLists);
      setLoading(false);
      setError(null);
    });

    const loadFallback = async (): Promise<void> => {
      try {
        const initial = await todoStorage.loadLists();
        setLists(initial);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lists';
        setError(errorMessage);
        showToastRef.current(errorMessage, 'error');
        console.error('Error loading initial lists:', err);
        setLoading(false);
      }
    };

    if (!unsubscribe) {
      void loadFallback();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const createList = useCallback(
    async (name: string, options?: CreateListOptions): Promise<string | null> => {
      try {
        const now = new Date();
        const newList: Omit<TodoList, 'id'> = {
          name,
          items: options?.seedItems ?? [],
          createdAt: now,
          updatedAt: now,
          sortBy: 'normal',
          ...(options?.activeGroupingId ? { activeGroupingId: options.activeGroupingId } : {}),
        };

        const listId = await todoStorage.createList(newList);
        showToastRef.current(`Created list "${name}"`, 'success');
        return listId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create list';
        showToastRef.current(errorMessage, 'error');
        console.error('Error creating list:', err);
        return null;
      }
    },
    [],
  );

  const updateList = useCallback(async (list: TodoList): Promise<boolean> => {
    const merged: TodoList = {
      ...list,
      updatedAt: new Date(),
    };
    try {
      await todoStorage.updateList(merged);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update list';
      showToastRef.current(errorMessage, 'error');
      console.error('Error updating list:', err);
      return false;
    }
  }, []);

  const deleteList = useCallback(async (listId: string, listName: string): Promise<boolean> => {
    try {
      await todoStorage.deleteList(listId);
      showToastRef.current(`Deleted list "${listName}"`, 'info');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list';
      showToastRef.current(errorMessage, 'error');
      console.error('Error deleting list:', err);
      return false;
    }
  }, []);

  const clearActiveGroupingForScheme = useCallback(
    async (schemeId: string): Promise<readonly string[]> => {
      const affected = listsRef.current.filter((l) => l.activeGroupingId === schemeId);
      if (affected.length === 0) {
        return [];
      }
      const now = new Date();
      await Promise.all(
        affected.map((list) => {
          const next: TodoList = {
            ...list,
            updatedAt: now,
          };
          delete next.activeGroupingId;
          delete next.groupOrder;
          return todoStorage.updateList(next).catch((err) => {
            console.error(`Error clearing grouping on list ${list.id}:`, err);
          });
        }),
      );
      return affected.map((l) => l.name);
    },
    [],
  );

  const value = useMemo<TodoListsContextValue>(
    () => ({
      lists,
      loading,
      error,
      createList,
      updateList,
      deleteList,
      clearActiveGroupingForScheme,
    }),
    [lists, loading, error, createList, updateList, deleteList, clearActiveGroupingForScheme],
  );

  return <TodoListsContext.Provider value={value}>{children}</TodoListsContext.Provider>;
}

export function useTodoLists(): TodoListsContextValue {
  const ctx = useContext(TodoListsContext);
  if (!ctx) {
    throw new Error('useTodoLists must be used within a TodoListsProvider');
  }
  return ctx;
}
