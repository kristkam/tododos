import React, { useState, useRef, useEffect } from 'react';
import type { TodoItem as TodoItemType } from '../types';

interface TodoItemProps {
  item: TodoItemType;
  onUpdate: (item: TodoItemType) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggleComplete = () => {
    onUpdate({ ...item, completed: !item.completed });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(item.text);
  };

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate({ ...item, text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSave();
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleCancel();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(item.id);
  };

  return (
    <div className={`todo-item ${item.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={handleToggleComplete}
        className="todo-checkbox"
      />
      
      {isEditing ? (
        <div className="todo-edit">
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="todo-edit-input"
          />
          <div className="todo-edit-actions">
            <button onClick={handleSaveClick} className="save-btn">✓</button>
            <button onClick={handleCancelClick} className="cancel-btn">✗</button>
          </div>
        </div>
      ) : (
        <div className="todo-content">
          <span 
            className="todo-text"
            onDoubleClick={handleEdit}
          >
            {item.text}
          </span>
          <div className="todo-actions">
            <button onClick={handleEditClick} className="edit-btn">✎</button>
            <button onClick={handleDeleteClick} className="delete-btn">🗑</button>
          </div>
        </div>
      )}
    </div>
  );
};