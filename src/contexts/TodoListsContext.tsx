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
import type { TodoList } from '../types';
import { todoStorage } from '../firebase/storageAdapter';
import { useToast } from '../hooks/useToast';

export type TodoListsContextValue = {
  lists: TodoList[];
  loading: boolean;
  error: string | null;
  createList: (name: string) => Promise<string | null>;
  updateList: (list: TodoList) => Promise<boolean>;
  deleteList: (listId: string, listName: string) => Promise<boolean>;
};

const TodoListsContext = createContext<TodoListsContextValue | undefined>(undefined);

type TodoListsProviderProps = {
  children: ReactNode;
};

export function TodoListsProvider({ children }: TodoListsProviderProps): ReactElement {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    const unsubscribe = todoStorage.subscribeToLists((updatedLists) => {
      setLists(updatedLists);
      setLoading(false);
      setError(null);
    });

    const loadFallback = async () => {
      try {
        const initialLists = await todoStorage.loadLists();
        setLists(initialLists);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lists';
        setError(errorMessage);
        showToastRef.current(errorMessage, 'error');
        console.error('Error loading initial data:', err);
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

  const createList = useCallback(async (name: string): Promise<string | null> => {
    try {
      const newList: Omit<TodoList, 'id'> = {
        name,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        sortBy: 'normal',
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
  }, []);

  const updateList = useCallback(async (list: TodoList): Promise<boolean> => {
    try {
      const updatedList: TodoList = {
        ...list,
        updatedAt: new Date(),
      };

      await todoStorage.updateList(updatedList);
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

  const value = useMemo<TodoListsContextValue>(
    () => ({
      lists,
      loading,
      error,
      createList,
      updateList,
      deleteList,
    }),
    [lists, loading, error, createList, updateList, deleteList]
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
