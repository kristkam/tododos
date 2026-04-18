import { useCallback, type ReactElement } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import { TemplateEditor } from '../components/TemplateEditor';
import { useTemplates } from '../contexts/TemplatesContext';
import { useGroupings } from '../contexts/GroupingsContext';
import type { ListTemplate } from '../types';

export function TemplateEditRoute(): ReactElement {
  const matchNew = useMatch({ path: '/templates/new', end: true });
  const { templateId } = useParams<{ templateId: string }>();
  const isNew = matchNew !== null;
  const navigate = useNavigate();
  const { templates, loading, createTemplate, updateTemplate } = useTemplates();
  const { schemes } = useGroupings();

  const template =
    !isNew && templateId ? templates.find((t) => t.id === templateId) : undefined;

  const handleSubmit = useCallback(
    async (payload: { name: string; items: ListTemplate['items']; groupingSchemeId?: string }): Promise<void> => {
      if (isNew) {
        const id = await createTemplate({
          name: payload.name,
          items: payload.items,
          groupingSchemeId: payload.groupingSchemeId,
        });
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
        groupingSchemeId: template.groupingSchemeId ?? payload.groupingSchemeId,
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

  const groupingLocked = Boolean(!isNew && template?.groupingSchemeId);

  return (
    <div className="lists-view template-edit-view">
      <h2 className="section-label">{isNew ? 'New template' : 'Edit template'}</h2>
      <TemplateEditor
        key={isNew ? 'new' : templateId}
        schemes={schemes}
        initialName={isNew ? '' : template?.name ?? ''}
        initialItems={isNew ? [] : template?.items ?? []}
        initialGroupingSchemeId={isNew ? undefined : template?.groupingSchemeId}
        groupingLocked={groupingLocked}
        submitLabel={isNew ? 'Create template' : 'Save template'}
        onSubmit={(p) => void handleSubmit(p)}
        onCancel={handleCancel}
      />
    </div>
  );
}
