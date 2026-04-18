import { useState, type FormEvent, type KeyboardEvent, type ReactElement } from 'react';
import type { TodoList } from '../types';
import { CheckIcon, DeleteIcon, PlusIcon } from './icons';

type ListSelectorProps = {
  lists: TodoList[];
  currentListId: string | null;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void | Promise<void>;
  onDeleteList: (listId: string) => void;
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
}: ListSelectorProps): ReactElement {
  const [newListName, setNewListName] = useState('');

  const submitCreateList = async (): Promise<void> => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    await Promise.resolve(onCreateList(trimmed));
    setNewListName('');
  };

  const onCreateKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submitCreateList();
    }
  };

  const onAddListSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void submitCreateList();
  };

  return (
    <div className="lists-view">
      <form className="add-list" onSubmit={onAddListSubmit}>
        <PlusIcon size={22} color="var(--color-text-muted)" />
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyDown={onCreateKeyDown}
          placeholder="Add new list"
          aria-label="Add new list"
          enterKeyHint="done"
          inputMode="text"
          autoComplete="off"
        />
        <button type="submit" className="field-submit-btn" aria-label="Create list">
          <CheckIcon size={18} color="currentColor" />
        </button>
      </form>

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
