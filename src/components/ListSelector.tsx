import React, { useState } from 'react';
import type { TodoList } from '../types';
import { CheckIcon, CancelIcon, DeleteIcon } from './icons';

interface ListSelectorProps {
  lists: TodoList[];
  currentListId: string | null;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (listId: string) => void;
}

export const ListSelector: React.FC<ListSelectorProps> = ({
  lists,
  currentListId,
  onSelectList,
  onCreateList,
  onDeleteList
}) => {
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateList = () => {
    if (newListName.trim()) {
      onCreateList(newListName.trim());
      setNewListName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateList();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNewListName('');
      setIsCreating(false);
    }
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleCreateList();
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewListName('');
    setIsCreating(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, listId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteList(listId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="list-selector">
      <div className="list-selector-header">
        <h2>Your Lists</h2>
        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)} 
            className="create-list-btn"
          >
            + New List
          </button>
        ) : (
          <div className="create-list-form">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="List name..."
              className="create-list-input"
              autoFocus
            />
            <button onClick={handleCreateClick} className="save-btn">
              <CheckIcon />
            </button>
            <button onClick={handleCancelClick} className="cancel-btn">
              <CancelIcon />
            </button>
          </div>
        )}
      </div>

      <div className="lists">
        {lists.length === 0 ? (
          <div className="empty-lists">
            No lists yet. Create your first list!
          </div>
        ) : (
          lists.map(list => (
            <div
              key={list.id}
              className={`list-item ${currentListId === list.id ? 'active' : ''}`}
              onClick={() => onSelectList(list.id)}
            >
              <div className="list-info">
                <h3>{list.name}</h3>
                <div className="list-meta">
                  <span className="item-count">{list.items.length} items</span>
                  <span className="list-date">Updated {formatDate(list.updatedAt)}</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteClick(e, list.id)}
                className="delete-list-btn"
                title="Delete list"
              >
                <DeleteIcon />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};