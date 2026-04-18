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
import type { GroupingScheme, ListTemplate, TemplateItem } from '../types';
import { templateStorage } from '../firebase/templateStorageAdapter';
import { groupingStorage } from '../firebase/groupingStorageAdapter';
import { useToast } from '../hooks/useToast';
import { normalizeListTemplates } from '../lib/normalizeGroupingForLists';

export type CreateTemplateInput = {
  name: string;
  items: TemplateItem[];
  groupingSchemeId?: string;
};

export type TemplatesContextValue = {
  templates: ListTemplate[];
  loading: boolean;
  error: string | null;
  createTemplate: (input: CreateTemplateInput) => Promise<string | null>;
  updateTemplate: (template: ListTemplate) => Promise<boolean>;
  deleteTemplate: (templateId: string, templateName: string) => Promise<boolean>;
};

export const TemplatesContext = createContext<TemplatesContextValue | undefined>(undefined);

type TemplatesProviderProps = {
  children: ReactNode;
};

export function TemplatesProvider({ children }: TemplatesProviderProps): ReactElement {
  const [templates, setTemplates] = useState<ListTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  const rawTemplatesRef = useRef<ListTemplate[]>([]);
  const schemesRef = useRef<GroupingScheme[]>([]);
  const templatesRef = useRef<ListTemplate[]>([]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  const applyNormalization = useCallback((): void => {
    setTemplates(normalizeListTemplates(rawTemplatesRef.current, schemesRef.current));
  }, []);

  useEffect(() => {
    const unsubTemplates = templateStorage.subscribeToTemplates((updated) => {
      rawTemplatesRef.current = updated;
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
        const [initialTemplates, initialSchemes] = await Promise.all([
          templateStorage.loadTemplates(),
          groupingStorage.loadSchemes(),
        ]);
        rawTemplatesRef.current = initialTemplates;
        schemesRef.current = initialSchemes;
        setTemplates(normalizeListTemplates(initialTemplates, initialSchemes));
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
        setError(errorMessage);
        showToastRef.current(errorMessage, 'error');
        console.error('Error loading templates:', err);
        setLoading(false);
      }
    };

    if (!unsubTemplates || !unsubSchemes) {
      void loadFallback();
    }

    return () => {
      if (unsubTemplates) {
        unsubTemplates();
      }
      if (unsubSchemes) {
        unsubSchemes();
      }
    };
  }, [applyNormalization]);

  const createTemplate = useCallback(async (input: CreateTemplateInput): Promise<string | null> => {
    try {
      const now = new Date();
      const newTemplate: Omit<ListTemplate, 'id'> = {
        name: input.name.trim(),
        items: input.items,
        createdAt: now,
        updatedAt: now,
        groupingSchemeId: input.groupingSchemeId,
      };
      const id = await templateStorage.createTemplate(newTemplate);
      showToastRef.current(`Created template "${newTemplate.name}"`, 'success');
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      showToastRef.current(errorMessage, 'error');
      console.error('Error creating template:', err);
      return null;
    }
  }, []);

  const updateTemplate = useCallback(async (template: ListTemplate): Promise<boolean> => {
    const stored = templatesRef.current.find((t) => t.id === template.id);
    if (
      stored?.groupingSchemeId !== undefined &&
      template.groupingSchemeId !== stored.groupingSchemeId
    ) {
      showToastRef.current('Cannot change grouping scheme on this template.', 'error');
      return false;
    }
    try {
      const updated: ListTemplate = {
        ...template,
        updatedAt: new Date(),
      };
      await templateStorage.updateTemplate(updated);
      showToastRef.current(`Saved template "${updated.name}"`, 'success');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      showToastRef.current(errorMessage, 'error');
      console.error('Error updating template:', err);
      return false;
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string, templateName: string): Promise<boolean> => {
    try {
      await templateStorage.deleteTemplate(templateId);
      showToastRef.current(`Deleted template "${templateName}"`, 'info');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      showToastRef.current(errorMessage, 'error');
      console.error('Error deleting template:', err);
      return false;
    }
  }, []);

  const value = useMemo<TemplatesContextValue>(
    () => ({
      templates,
      loading,
      error,
      createTemplate,
      updateTemplate,
      deleteTemplate,
    }),
    [templates, loading, error, createTemplate, updateTemplate, deleteTemplate],
  );

  return <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>;
}

export function useTemplates(): TemplatesContextValue {
  const ctx = useContext(TemplatesContext);
  if (!ctx) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return ctx;
}
