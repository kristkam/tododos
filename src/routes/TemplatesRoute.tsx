import { useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmTypeToDeleteModal } from '../components/ConfirmTypeToDeleteModal';
import { useTemplates } from '../contexts/TemplatesContext';
import type { ListTemplate } from '../types';

function formatTemplateUpdatedDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TemplatesRoute(): ReactElement {
  const { templates, loading, deleteTemplate } = useTemplates();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ListTemplate | null>(null);

  const requestDelete = (templateId: string): void => {
    const found = templates.find((t) => t.id === templateId);
    if (found) {
      setTemplateToDelete(found);
      setShowDeleteModal(true);
    }
  };

  const cancelDelete = (): void => {
    setShowDeleteModal(false);
    setTemplateToDelete(null);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!templateToDelete) {
      return;
    }
    const { id, name } = templateToDelete;
    setShowDeleteModal(false);
    setTemplateToDelete(null);
    await deleteTemplate(id, name);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading templates…</p>
      </div>
    );
  }

  return (
    <>
      <div className="lists-view templates-view">
        <div className="templates-view-header">
          <h2 className="section-label templates-view-title">Templates</h2>
          <Link to="/templates/new" className="templates-new-link">
            New template
          </Link>
        </div>
        <p className="templates-view-intro">
          Reusable lists of items. Start a new todo list from a template on the home screen.
        </p>

        {templates.length === 0 ? (
          <div className="empty-lists">
            No templates yet.{' '}
            <Link to="/templates/new">Create your first template</Link>.
          </div>
        ) : (
          <ul className="list-rows">
            {templates.map((template) => (
              <li key={template.id} className="list-rows-item">
                <div className="list-row-card template-row-card">
                  <div className="template-row-main">
                    <div className="list-row-title">{template.name}</div>
                    <div className="list-row-subtitle">
                      {template.items.length} {template.items.length === 1 ? 'item' : 'items'} · Updated{' '}
                      {formatTemplateUpdatedDate(template.updatedAt)}
                    </div>
                  </div>
                  <div className="template-row-actions">
                    <button
                      type="button"
                      className="template-row-edit"
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="template-row-destroy"
                      onClick={() => requestDelete(template.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="templates-view-footer">
          <Link to="/">Back to lists</Link>
          {' · '}
          <Link to="/groupings">Groupings</Link>
        </p>
      </div>

      <ConfirmTypeToDeleteModal
        isOpen={showDeleteModal}
        title="Delete template"
        message={
          templateToDelete
            ? `Deleting "${templateToDelete.name}" cannot be undone. Lists you already created from this template are not affected.`
            : ''
        }
        confirmPhrase={templateToDelete?.name ?? ''}
        confirmText="Delete template"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={cancelDelete}
      />
    </>
  );
}
