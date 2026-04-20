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
import type { GroupingScheme, ItemGroup } from '../types';
import { groupingStorage } from '../firebase/groupingStorageAdapter';
import { useToast } from '../hooks/useToast';
import {
  normalizeGroupAliases,
  validateGroupingSchemeDraft,
} from '../lib/groupingSchemeInvariants';
import { useTodoLists } from './TodoListsContext';

export type CreateSchemeInput = {
  name: string;
  groups: ItemGroup[];
};

export type UpdateSchemeOptions = {
  /** Skip the success toast. Intended for autosave flows where per-edit toasts would be noise. */
  silent?: boolean;
};

export type GroupingsContextValue = {
  schemes: GroupingScheme[];
  loading: boolean;
  error: string | null;
  createScheme: (input: CreateSchemeInput) => Promise<string | null>;
  /** Persist the full scheme. Pass `{ silent: true }` to skip the success toast (autosave). */
  updateScheme: (scheme: GroupingScheme, opts?: UpdateSchemeOptions) => Promise<boolean>;
  deleteScheme: (schemeId: string, schemeName: string) => Promise<boolean>;
  /** Write `order` as the canonical group order of the given scheme. */
  reorderSchemeGroups: (schemeId: string, order: readonly string[]) => Promise<boolean>;
};

export const GroupingsContext = createContext<GroupingsContextValue | undefined>(undefined);

type GroupingsProviderProps = {
  children: ReactNode;
};

function normalizeSchemeGroups(groups: readonly ItemGroup[]): ItemGroup[] {
  return groups.map(normalizeGroupAliases);
}

function formatClearedListsSummary(names: readonly string[]): string {
  const MAX = 3;
  if (names.length <= MAX) {
    return names.join(', ');
  }
  return `${names.slice(0, MAX).join(', ')} +${names.length - MAX} more`;
}

export function GroupingsProvider({ children }: GroupingsProviderProps): ReactElement {
  const [schemes, setSchemes] = useState<GroupingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  const schemesRef = useRef<GroupingScheme[]>([]);
  const { clearActiveGroupingForScheme } = useTodoLists();

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    schemesRef.current = schemes;
  }, [schemes]);

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

  const createScheme = useCallback(async (input: CreateSchemeInput): Promise<string | null> => {
    const normalizedGroups = normalizeSchemeGroups(input.groups);
    const draft = { name: input.name, groups: normalizedGroups };
    const validation = validateGroupingSchemeDraft(draft);
    if (validation) {
      showToastRef.current('Invalid grouping. Check the name, groups, and aliases.', 'error');
      return null;
    }
    try {
      const now = new Date();
      const newScheme: Omit<GroupingScheme, 'id'> = {
        name: input.name.trim(),
        groups: normalizedGroups,
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
  }, []);

  const updateScheme = useCallback(
    async (scheme: GroupingScheme, opts?: UpdateSchemeOptions): Promise<boolean> => {
      const silent = opts?.silent ?? false;
      const normalizedGroups = normalizeSchemeGroups(scheme.groups);
      const validation = validateGroupingSchemeDraft({
        name: scheme.name,
        groups: normalizedGroups,
      });
      if (validation) {
        if (!silent) {
          showToastRef.current('Invalid grouping. Check the name, groups, and aliases.', 'error');
        }
        return false;
      }
      try {
        const updated: GroupingScheme = {
          ...scheme,
          name: scheme.name.trim(),
          groups: normalizedGroups,
          updatedAt: new Date(),
        };
        await groupingStorage.updateScheme(updated);
        if (!silent) {
          showToastRef.current(`Saved grouping "${updated.name}"`, 'success');
        }
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save grouping scheme';
        showToastRef.current(errorMessage, 'error');
        console.error('Error updating grouping scheme:', err);
        return false;
      }
    },
    [],
  );

  const deleteScheme = useCallback(
    async (schemeId: string, schemeName: string): Promise<boolean> => {
      try {
        await groupingStorage.deleteScheme(schemeId);
        const clearedNames = await clearActiveGroupingForScheme(schemeId);
        if (clearedNames.length === 0) {
          showToastRef.current(`Deleted grouping "${schemeName}"`, 'info');
        } else {
          const summary = formatClearedListsSummary(clearedNames);
          const label = clearedNames.length === 1 ? 'list' : 'lists';
          showToastRef.current(
            `Deleted grouping "${schemeName}". Cleared from ${clearedNames.length} ${label}: ${summary}`,
            'info',
          );
        }
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete grouping scheme';
        showToastRef.current(errorMessage, 'error');
        console.error('Error deleting grouping scheme:', err);
        return false;
      }
    },
    [clearActiveGroupingForScheme],
  );

  const reorderSchemeGroups = useCallback(
    async (schemeId: string, order: readonly string[]): Promise<boolean> => {
      const scheme = schemesRef.current.find((s) => s.id === schemeId);
      if (!scheme) {
        return false;
      }
      const byId = new Map<string, ItemGroup>();
      for (const g of scheme.groups) {
        byId.set(g.id, g);
      }
      const seen = new Set<string>();
      const ordered: ItemGroup[] = [];
      for (const id of order) {
        const g = byId.get(id);
        if (g && !seen.has(id)) {
          ordered.push(g);
          seen.add(id);
        }
      }
      for (const g of scheme.groups) {
        if (!seen.has(g.id)) {
          ordered.push(g);
        }
      }
      if (ordered.length !== scheme.groups.length) {
        return false;
      }
      const updated: GroupingScheme = {
        ...scheme,
        groups: ordered,
        updatedAt: new Date(),
      };
      try {
        await groupingStorage.updateScheme(updated);
        showToastRef.current(`Saved order for "${updated.name}"`, 'success');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save group order';
        showToastRef.current(errorMessage, 'error');
        console.error('Error reordering scheme groups:', err);
        return false;
      }
    },
    [],
  );

  const value = useMemo<GroupingsContextValue>(
    () => ({
      schemes,
      loading,
      error,
      createScheme,
      updateScheme,
      deleteScheme,
      reorderSchemeGroups,
    }),
    [schemes, loading, error, createScheme, updateScheme, deleteScheme, reorderSchemeGroups],
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
