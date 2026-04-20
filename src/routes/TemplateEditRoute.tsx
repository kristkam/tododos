import { useCallback, type ReactElement } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import { TemplateEditor } from '../components/TemplateEditor';
import { useTemplates } from '../contexts/TemplatesContext';
import type { ListTemplate, TemplateItem } from '../types';

export function TemplateEditRoute(): ReactElement {
  const matchNew = useMatch({ path: '/templates/new', end: true });
  const { templateId } = useParams<{ templateId: string }>();
  const isNew = matchNew !== null;
  const navigate = useNavigate();
  const { templates, loading, createTemplate, updateTemplate } = useTemplates();

  const template =
    !isNew && templateId ? templates.find((t) => t.id === templateId) : undefined;

  const handleSubmit = useCallback(
    async (payload: { name: string; items: TemplateItem[] }): Promise<void> => {
      if (isNew) {
        const id = await createTemplate({ name: payload.name, items: payload.items });
        if (id) {
          navigate('/templates');
        }
        return;
      }
      if (!template) {
        return;
      }
      const updated: ListTemplate = {
        ...template,
        name: payload.name,
        items: payload.items,
      };
      const ok = await updateTemplate(updated);
      if (ok) {
        navigate('/templates');
      }
    },
    [createTemplate, isNew, navigate, template, updateTemplate],
  );

  const handleCancel = useCallback((): void => {
    navigate('/templates');
  }, [navigate]);

  if (!isNew) {
    if (loading) {
      return (
        <div className="loading">
          <div className="loading-spinner" />
          <p>Loading template…</p>
        </div>
      );
    }
    if (!templateId || !template) {
      return (
        <div className="error-panel">
          <p>Template not found.</p>
          <button type="button" className="error-panel-action" onClick={() => navigate('/templates')}>
            Back to templates
          </button>
        </div>
      );
    }
  }

  return (
    <div className="lists-view template-edit-view">
      <h2 className="section-label">{isNew ? 'New template' : 'Edit template'}</h2>
      <TemplateEditor
        key={isNew ? 'new' : templateId}
        initialName={isNew ? '' : template?.name ?? ''}
        initialItems={isNew ? [] : template?.items ?? []}
        submitLabel={isNew ? 'Create template' : 'Save template'}
        onSubmit={(p) => void handleSubmit(p)}
        onCancel={handleCancel}
      />
    </div>
  );
}
