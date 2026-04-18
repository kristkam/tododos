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
import type { GroupingScheme, TodoItem, TodoList } from '../types';
import { todoStorage } from '../firebase/storageAdapter';
import { groupingStorage } from '../firebase/groupingStorageAdapter';
import { useToast } from '../hooks/useToast';
import { normalizeTodoLists } from '../lib/normalizeGroupingForLists';

export type CreateListOptions = {
  seedItems?: TodoItem[];
  groupingSchemeId?: string;
};

export type TodoListsContextValue = {
  lists: TodoList[];
  loading: boolean;
  error: string | null;
  createList: (name: string, options?: CreateListOptions) => Promise<string | null>;
  updateList: (list: TodoList) => Promise<boolean>;
  deleteList: (listId: string, listName: string) => Promise<boolean>;
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
  const rawListsRef = useRef<TodoList[]>([]);
  const schemesRef = useRef<GroupingScheme[]>([]);
  const listsRef = useRef<TodoList[]>([]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  const applyNormalization = useCallback((): void => {
    setLists(normalizeTodoLists(rawListsRef.current, schemesRef.current));
  }, []);

  useEffect(() => {
    const unsubLists = todoStorage.subscribeToLists((updatedLists) => {
      rawListsRef.current = updatedLists;
      applyNormalization();
      setLoading(false);
      setError(null);
    });

    const unsubSchemes = groupingStorage.subscribeToSchemes((updatedSchemes) => {
      schemesRef.current = updatedSchemes;
      applyNormalization();
    });

    const loadFallback = async (): Promise<void> => {
      try {
        const [initialLists, initialSchemes] = await Promise.all([
          todoStorage.loadLists(),
          groupingStorage.loadSchemes(),
        ]);
        rawListsRef.current = initialLists;
        schemesRef.current = initialSchemes;
        setLists(normalizeTodoLists(initialLists, initialSchemes));
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lists';
        setError(errorMessage);
        showToastRef.current(errorMessage, 'error');
        console.error('Error loading initial data:', err);
        setLoading(false);
      }
    };

    if (!unsubLists) {
      void loadFallback();
    } else if (!unsubSchemes) {
      void loadFallback();
    }

    return () => {
      if (unsubLists) {
        unsubLists();
      }
      if (unsubSchemes) {
        unsubSchemes();
      }
    };
  }, [applyNormalization]);

  const createList = useCallback(async (name: string, options?: CreateListOptions): Promise<string | null> => {
    const schemeId = options?.groupingSchemeId;
    const scheme = schemeId ? schemesRef.current.find((s) => s.id === schemeId) : undefined;
    if (schemeId && !scheme) {
      showToastRef.current('That grouping scheme is not available. Try again after it loads.', 'error');
      return null;
    }

    let items = options?.seedItems ?? [];
    if (scheme) {
      const ids = new Set(scheme.groups.map((g) => g.id));
      items = items.map((item) => ({
        ...item,
        groupId:
          item.groupId !== undefined && ids.has(item.groupId) ? item.groupId : scheme.defaultGroupId,
      }));
    }

    try {
      const newList: Omit<TodoList, 'id'> = {
        name,
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
        sortBy: 'normal',
        groupingSchemeId: schemeId,
        groupBy: false,
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
    const stored = listsRef.current.find((l) => l.id === list.id);
    const storedSchemeId = stored?.groupingSchemeId;
    const listAlreadyHasScheme = Boolean(storedSchemeId && String(storedSchemeId).length > 0);
    /** Assign-once: lists created without a scheme may set `groupingSchemeId` once; afterward it is locked. */
    const mergedGroupingSchemeId = listAlreadyHasScheme ? storedSchemeId : list.groupingSchemeId;
    const merged: TodoList = {
      ...list,
      groupingSchemeId: mergedGroupingSchemeId,
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

  const value = useMemo<TodoListsContextValue>(
    () => ({
      lists,
      loading,
      error,
      createList,
      updateList,
      deleteList,
    }),
    [lists, loading, error, createList, updateList, deleteList],
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
