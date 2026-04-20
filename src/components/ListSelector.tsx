import { useState, type FormEvent, type KeyboardEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { TodoList } from '../types';
import { DeleteIcon } from './icons';

const NEW_LIST_INPUT_ID = 'new-list-name';

type ListSelectorProps = {
  lists: TodoList[];
  currentListId: string | null;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void | Promise<void>;
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
  onSelectList,
  onCreateList,
  onDeleteList,
  onStartFromTemplate,
}: ListSelectorProps): ReactElement {
  const [newListName, setNewListName] = useState('');
  const canCreateList = newListName.trim().length > 0;

  const submitCreateList = async (): Promise<void> => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    await Promise.resolve(onCreateList(trimmed));
    setNewListName('');
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
        <div className="add-list-secondary add-list-links">
          {onStartFromTemplate ? (
            <>
              <button type="button" className="add-list-from-template" onClick={onStartFromTemplate}>
                Start from template
              </button>
              <span className="add-list-links-sep" aria-hidden>
                ·
              </span>
            </>
          ) : null}
          <Link to="/groupings">Manage groupings</Link>
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
