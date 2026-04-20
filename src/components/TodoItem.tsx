import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import type { TodoItem as TodoItemType } from '../types';
import { DeleteIcon, EditIcon } from './icons';
import { Checkbox } from './Checkbox';

type TodoItemProps = {
  item: TodoItemType;
  onUpdate: (item: TodoItemType) => void;
  onDelete: (itemId: string) => void;
  /** Drag handle for reorder (dnd-kit). */
  dragHandle?: ReactNode;
};

export function TodoItem({ item, onUpdate, onDelete, dragHandle }: TodoItemProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditText(item.text);
    }
  }, [item.text, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const openEdit = (): void => {
    setIsEditing(true);
    setEditText(item.text);
  };

  const saveEdit = (): void => {
    const trimmed = editText.trim();
    if (trimmed) {
      onUpdate({ ...item, text: trimmed });
    }
    setIsEditing(false);
    setEditText(trimmed || item.text);
  };

  const cancelEdit = (): void => {
    setEditText(item.text);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleBlur = (): void => {
    if (!isEditing) {
      return;
    }
    saveEdit();
  };

  return (
    <div className={`task-row ${item.completed ? 'is-completed' : ''}`}>
      {dragHandle}
      <Checkbox
        checked={item.completed}
        onChange={(completed) => onUpdate({ ...item, completed })}
        label={item.text}
      />
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={handleBlur}
          className="text-field task-row-edit"
          aria-label="Edit task text"
          enterKeyHint="done"
        />
      ) : (
        <>
          <span className="task-row-text" onDoubleClick={openEdit}>
            {item.text}
          </span>
          <div className="task-row-actions">
            <button
              type="button"
              className="btn btn--icon"
              aria-label={`Edit ${item.text}`}
              onClick={(e) => {
                e.stopPropagation();
                openEdit();
              }}
            >
              <EditIcon size={18} />
            </button>
            <button
              type="button"
              className="btn btn--icon btn--danger"
              aria-label={`Delete ${item.text}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <DeleteIcon size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
