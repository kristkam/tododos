import { useMemo, useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmTypeToDeleteModal } from '../components/ConfirmTypeToDeleteModal';
import { DeleteIcon, EditIcon } from '../components/icons';
import { useGroupings } from '../contexts/GroupingsContext';
import { useTodoLists } from '../contexts/TodoListsContext';
import type { GroupingScheme } from '../types';

function formatSchemeUpdatedDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function usageLine(listCount: number): string {
  if (listCount === 0) {
    return 'Not in use';
  }
  return `Active on ${listCount} list${listCount === 1 ? '' : 's'}`;
}

function formatAffectedListsForMessage(names: readonly string[]): string {
  const MAX = 5;
  if (names.length <= MAX) {
    return names.map((n) => `"${n}"`).join(', ');
  }
  const shown = names.slice(0, MAX).map((n) => `"${n}"`).join(', ');
  return `${shown} and ${names.length - MAX} more`;
}

export function GroupingsRoute(): ReactElement {
  const { schemes, loading, deleteScheme } = useGroupings();
  const { lists } = useTodoLists();
  const navigate = useNavigate();
  const [schemeToDelete, setSchemeToDelete] = useState<GroupingScheme | null>(null);

  const affectedListsByScheme = useMemo(() => {
    const by = new Map<string, string[]>();
    for (const list of lists) {
      if (!list.activeGroupingId) continue;
      const bucket = by.get(list.activeGroupingId);
      if (bucket) {
        bucket.push(list.name);
      } else {
        by.set(list.activeGroupingId, [list.name]);
      }
    }
    return by;
  }, [lists]);

  const requestDelete = (schemeId: string): void => {
    const found = schemes.find((s) => s.id === schemeId);
    if (found) {
      setSchemeToDelete(found);
    }
  };

  const cancelDelete = (): void => {
    setSchemeToDelete(null);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!schemeToDelete) {
      return;
    }
    const { id, name } = schemeToDelete;
    setSchemeToDelete(null);
    await deleteScheme(id, name);
  };

  const deleteMessage = useMemo(() => {
    if (!schemeToDelete) return '';
    const affected = affectedListsByScheme.get(schemeToDelete.id) ?? [];
    if (affected.length === 0) {
      return `Delete "${schemeToDelete.name}"? This cannot be undone.`;
    }
    const label = affected.length === 1 ? 'list' : 'lists';
    return `Delete "${schemeToDelete.name}"? It's active on ${affected.length} ${label}: ${formatAffectedListsForMessage(affected)}. Those lists will revert to ungrouped view.`;
  }, [schemeToDelete, affectedListsByScheme]);

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
          <h2 className="templates-view-title">Groupings</h2>
          <Link to="/groupings/new" className="btn btn--primary">
            New grouping
          </Link>
        </div>
        <p className="templates-view-intro">
          Define named groups with aliases (e.g. dinners or grocery aisles). Apply a grouping to any list from the list view.
        </p>

        {schemes.length === 0 ? (
          <div className="empty-state">
            No groupings yet. <Link to="/groupings/new">Create your first grouping</Link>.
          </div>
        ) : (
          <ul className="list-rows">
            {schemes.map((scheme) => {
              const affected = affectedListsByScheme.get(scheme.id) ?? [];
              return (
                <li key={scheme.id} className="list-rows-item">
                  <div className="card list-row-card template-row-card">
                    <div className="template-row-main">
                      <div className="list-row-title">{scheme.name}</div>
                      <div className="list-row-subtitle">
                        {scheme.groups.length} {scheme.groups.length === 1 ? 'group' : 'groups'} ·{' '}
                        {usageLine(affected.length)} · Updated{' '}
                        {formatSchemeUpdatedDate(scheme.updatedAt)}
                      </div>
                    </div>
                    <div className="template-row-actions">
                      <button
                        type="button"
                        className="btn btn--icon"
                        aria-label={`Edit grouping ${scheme.name}`}
                        onClick={() => navigate(`/groupings/${scheme.id}/edit`)}
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--icon btn--danger"
                        aria-label={`Delete grouping ${scheme.name}`}
                        onClick={() => requestDelete(scheme.id)}
                      >
                        <DeleteIcon size={18} />
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

      <ConfirmTypeToDeleteModal
        isOpen={schemeToDelete !== null}
        title="Delete grouping"
        message={deleteMessage}
        confirmPhrase={schemeToDelete?.name ?? ''}
        confirmText="Delete grouping"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={cancelDelete}
      />
    </>
  );
}
