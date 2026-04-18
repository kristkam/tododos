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
import type { GroupingScheme } from '../types';
import { groupingStorage } from '../firebase/groupingStorageAdapter';
import { useToast } from '../hooks/useToast';
import { validateGroupingSchemeDraft } from '../lib/groupingSchemeInvariants';
import { useTodoLists } from './TodoListsContext';
import { useTemplates } from './TemplatesContext';

export type GroupingsContextValue = {
  schemes: GroupingScheme[];
  loading: boolean;
  error: string | null;
  createScheme: (input: Omit<GroupingScheme, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateScheme: (scheme: GroupingScheme) => Promise<boolean>;
  deleteScheme: (schemeId: string, schemeName: string) => Promise<boolean>;
};

export const GroupingsContext = createContext<GroupingsContextValue | undefined>(undefined);

type GroupingsProviderProps = {
  children: ReactNode;
};

export function GroupingsProvider({ children }: GroupingsProviderProps): ReactElement {
  const [schemes, setSchemes] = useState<GroupingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  const { lists } = useTodoLists();
  const { templates } = useTemplates();

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    const unsubscribe = groupingStorage.subscribeToSchemes((updated) => {
      setSchemes(updated);
      setLoading(false);
      setError(null);
    });

    const loadFallback = async (): Promise<void> => {
      try {
        const initial = await groupingStorage.loadSchemes();
        setSchemes(initial);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load grouping schemes';
        setError(errorMessage);
        showToastRef.current(errorMessage, 'error');
        console.error('Error loading grouping schemes:', err);
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

  const createScheme = useCallback(
    async (input: Omit<GroupingScheme, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
      const validation = validateGroupingSchemeDraft({
        name: input.name,
        groups: input.groups,
        defaultGroupId: input.defaultGroupId,
      });
      if (validation) {
        showToastRef.current('Invalid grouping scheme. Check name, groups, and default group.', 'error');
        return null;
      }
      try {
        const now = new Date();
        const newScheme: Omit<GroupingScheme, 'id'> = {
          name: input.name.trim(),
          groups: input.groups.map((g) => ({ id: g.id, name: g.name.trim() })),
          defaultGroupId: input.defaultGroupId,
          createdAt: now,
          updatedAt: now,
        };
        const id = await groupingStorage.createScheme(newScheme);
        showToastRef.current(`Created grouping "${newScheme.name}"`, 'success');
        return id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create grouping scheme';
        showToastRef.current(errorMessage, 'error');
        console.error('Error creating grouping scheme:', err);
        return null;
      }
    },
    [],
  );

  const updateScheme = useCallback(async (scheme: GroupingScheme): Promise<boolean> => {
    const validation = validateGroupingSchemeDraft({
      name: scheme.name,
      groups: scheme.groups,
      defaultGroupId: scheme.defaultGroupId,
    });
    if (validation) {
      showToastRef.current('Invalid grouping scheme. Check name, groups, and default group.', 'error');
      return false;
    }
    try {
      const updated: GroupingScheme = {
        ...scheme,
        name: scheme.name.trim(),
        groups: scheme.groups.map((g) => ({ id: g.id, name: g.name.trim() })),
        updatedAt: new Date(),
      };
      await groupingStorage.updateScheme(updated);
      showToastRef.current(`Saved grouping "${updated.name}"`, 'success');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save grouping scheme';
      showToastRef.current(errorMessage, 'error');
      console.error('Error updating grouping scheme:', err);
      return false;
    }
  }, []);

  const deleteScheme = useCallback(
    async (schemeId: string, schemeName: string): Promise<boolean> => {
      const listCount = lists.filter((l) => l.groupingSchemeId === schemeId).length;
      const templateCount = templates.filter((t) => t.groupingSchemeId === schemeId).length;
      if (listCount > 0 || templateCount > 0) {
        showToastRef.current(
          `Cannot delete "${schemeName}" — it is used by ${listCount} list(s) and ${templateCount} template(s).`,
          'error',
        );
        return false;
      }
      try {
        await groupingStorage.deleteScheme(schemeId);
        showToastRef.current(`Deleted grouping "${schemeName}"`, 'info');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete grouping scheme';
        showToastRef.current(errorMessage, 'error');
        console.error('Error deleting grouping scheme:', err);
        return false;
      }
    },
    [lists, templates],
  );

  const value = useMemo<GroupingsContextValue>(
    () => ({
      schemes,
      loading,
      error,
      createScheme,
      updateScheme,
      deleteScheme,
    }),
    [schemes, loading, error, createScheme, updateScheme, deleteScheme],
  );

  return <GroupingsContext.Provider value={value}>{children}</GroupingsContext.Provider>;
}

export function useGroupings(): GroupingsContextValue {
  const ctx = useContext(GroupingsContext);
  if (!ctx) {
    throw new Error('useGroupings must be used within a GroupingsProvider');
  }
  return ctx;
}
