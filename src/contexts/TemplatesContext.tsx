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
import type { ListTemplate, TemplateItem } from '../types';
import { templateStorage } from '../firebase/templateStorageAdapter';
import { useToast } from '../hooks/useToast';

export type CreateTemplateInput = {
  name: string;
  items: TemplateItem[];
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

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    const unsubscribe = templateStorage.subscribeToTemplates((updated) => {
      setTemplates(updated);
      setLoading(false);
      setError(null);
    });

    const loadFallback = async (): Promise<void> => {
      try {
        const initial = await templateStorage.loadTemplates();
        setTemplates(initial);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
        setError(errorMessage);
        showToastRef.current(errorMessage, 'error');
        console.error('Error loading templates:', err);
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

  const createTemplate = useCallback(async (input: CreateTemplateInput): Promise<string | null> => {
    try {
      const now = new Date();
      const newTemplate: Omit<ListTemplate, 'id'> = {
        name: input.name.trim(),
        items: input.items,
        createdAt: now,
        updatedAt: now,
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
