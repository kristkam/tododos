import { useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/ConfirmModal';
import { useGroupings } from '../contexts/GroupingsContext';
import { useTodoLists } from '../contexts/TodoListsContext';
import { useTemplates } from '../contexts/TemplatesContext';
import type { GroupingScheme } from '../types';

function formatSchemeUpdatedDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function usageLine(listCount: number, templateCount: number): string {
  const parts: string[] = [];
  if (listCount > 0) {
    parts.push(`${listCount} list${listCount === 1 ? '' : 's'}`);
  }
  if (templateCount > 0) {
    parts.push(`${templateCount} template${templateCount === 1 ? '' : 's'}`);
  }
  if (parts.length === 0) {
    return 'Not in use';
  }
  return `Used by ${parts.join(' and ')}`;
}

export function GroupingsRoute(): ReactElement {
  const { schemes, loading, deleteScheme } = useGroupings();
  const { lists } = useTodoLists();
  const { templates } = useTemplates();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [schemeToDelete, setSchemeToDelete] = useState<GroupingScheme | null>(null);

  const requestDelete = (schemeId: string): void => {
    const found = schemes.find((s) => s.id === schemeId);
    if (found) {
      setSchemeToDelete(found);
      setShowDeleteModal(true);
    }
  };

  const cancelDelete = (): void => {
    setShowDeleteModal(false);
    setSchemeToDelete(null);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!schemeToDelete) {
      return;
    }
    const { id, name } = schemeToDelete;
    setShowDeleteModal(false);
    setSchemeToDelete(null);
    await deleteScheme(id, name);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading groupings…</p>
      </div>
    );
  }

  return (
    <>
      <div className="lists-view templates-view">
        <div className="templates-view-header">
          <h2 className="section-label templates-view-title">Groupings</h2>
          <Link to="/groupings/new" className="templates-new-link">
            New grouping
          </Link>
        </div>
        <p className="templates-view-intro">
          Define named groups (e.g. dinners or grocery aisles). Pick a grouping when you create a list.
        </p>

        {schemes.length === 0 ? (
          <div className="empty-lists">
            No groupings yet. <Link to="/groupings/new">Create your first grouping</Link>.
          </div>
        ) : (
          <ul className="list-rows">
            {schemes.map((scheme) => {
              const listCount = lists.filter((l) => l.groupingSchemeId === scheme.id).length;
              const templateCount = templates.filter((t) => t.groupingSchemeId === scheme.id).length;
              return (
                <li key={scheme.id} className="list-rows-item">
                  <div className="list-row-card template-row-card">
                    <div className="template-row-main">
                      <div className="list-row-title">{scheme.name}</div>
                      <div className="list-row-subtitle">
                        {scheme.groups.length} {scheme.groups.length === 1 ? 'group' : 'groups'} ·{' '}
                        {usageLine(listCount, templateCount)} · Updated{' '}
                        {formatSchemeUpdatedDate(scheme.updatedAt)}
                      </div>
                    </div>
                    <div className="template-row-actions">
                      <button
                        type="button"
                        className="template-row-edit"
                        onClick={() => navigate(`/groupings/${scheme.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="template-row-destroy"
                        onClick={() => requestDelete(scheme.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="templates-view-footer">
          <Link to="/">Back to lists</Link>
        </p>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete grouping"
        message={
          schemeToDelete
            ? `Delete "${schemeToDelete.name}"? This cannot be undone. You can only delete groupings that are not used by any list or template.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={cancelDelete}
      />
    </>
  );
}
