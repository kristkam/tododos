import { useState, type FormEvent, type KeyboardEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { GroupingScheme, TodoList } from '../types';
import { DeleteIcon } from './icons';

const NEW_LIST_INPUT_ID = 'new-list-name';
const NEW_LIST_GROUPING_ID = 'new-list-grouping';

type ListSelectorProps = {
  lists: TodoList[];
  currentListId: string | null;
  groupingSchemes: GroupingScheme[];
  groupingsLoading: boolean;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string, options?: { groupingSchemeId?: string }) => void | Promise<void>;
  onDeleteList: (listId: string) => void;
  onStartFromTemplate?: () => void;
};

function formatListUpdatedDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ListSelector({
  lists,
  currentListId,
  groupingSchemes,
  groupingsLoading,
  onSelectList,
  onCreateList,
  onDeleteList,
  onStartFromTemplate,
}: ListSelectorProps): ReactElement {
  const [newListName, setNewListName] = useState('');
  const [newListGroupingId, setNewListGroupingId] = useState('');
  const canCreateList = newListName.trim().length > 0;

  const submitCreateList = async (): Promise<void> => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const schemeId = newListGroupingId.trim() || undefined;
    await Promise.resolve(
      onCreateList(trimmed, schemeId ? { groupingSchemeId: schemeId } : undefined),
    );
    setNewListName('');
    setNewListGroupingId('');
  };

  const onCreateKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canCreateList) {
        void submitCreateList();
      }
    }
  };

  const onAddListSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void submitCreateList();
  };

  return (
    <div className="lists-view">
      <div className="add-list-card">
        <label htmlFor={NEW_LIST_INPUT_ID} className="add-list-card-eyebrow">
          New list
        </label>
        <form className="add-list" onSubmit={onAddListSubmit} aria-label="Create a new list">
          <input
            id={NEW_LIST_INPUT_ID}
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={onCreateKeyDown}
            placeholder="New list…"
            enterKeyHint="done"
            inputMode="text"
            autoComplete="off"
          />
          <button
            type="submit"
            className="add-list-submit"
            disabled={!canCreateList}
            onMouseDown={(e) => {
              if (!canCreateList) {
                return;
              }
              e.preventDefault();
            }}
          >
            Add list
          </button>
        </form>
        <div className="add-list-grouping-row">
          <label htmlFor={NEW_LIST_GROUPING_ID} className="add-list-grouping-label">
            Grouping (optional)
          </label>
          <select
            id={NEW_LIST_GROUPING_ID}
            className="add-list-grouping-select"
            value={newListGroupingId}
            onChange={(e) => setNewListGroupingId(e.target.value)}
            disabled={groupingsLoading || groupingSchemes.length === 0}
            aria-busy={groupingsLoading}
          >
            <option value="">None</option>
            {groupingSchemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="add-list-secondary add-list-links">
          <Link to="/groupings">Manage groupings</Link>
          {onStartFromTemplate ? (
            <>
              <span className="add-list-links-sep" aria-hidden>
                ·
              </span>
              <button type="button" className="add-list-from-template" onClick={onStartFromTemplate}>
                Start from template…
              </button>
            </>
          ) : null}
        </div>
      </div>

      <h2 className="section-label">Your lists</h2>

      {lists.length === 0 ? (
        <div className="empty-lists">No lists yet. Create your first list!</div>
      ) : (
        <ul className="list-rows">
          {lists.map((list) => (
            <li key={list.id} className="list-rows-item">
              <div className={`list-row-card ${currentListId === list.id ? 'is-active' : ''}`}>
                <button type="button" className="list-row-main" onClick={() => onSelectList(list.id)}>
                  <div className="list-row-title">{list.name}</div>
                  <div className="list-row-subtitle">
                    {list.items.length} {list.items.length === 1 ? 'item' : 'items'} · Updated{' '}
                    {formatListUpdatedDate(list.updatedAt)}
                  </div>
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger list-row-delete"
                  aria-label={`Delete list ${list.name}`}
                  onClick={() => onDeleteList(list.id)}
                >
                  <DeleteIcon size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
