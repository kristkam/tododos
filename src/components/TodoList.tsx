import React, { useState, useTransition, useMemo } from 'react';
import type { TodoList as TodoListType, TodoItem as TodoItemType } from '../types';
import { TodoItem } from './TodoItem';

type SortOption = 'normal' | 'completed-top' | 'completed-bottom' | 'alphabetical' | 'newest-first' | 'oldest-first';

interface TodoListProps {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ list, onUpdateList }) => {
  const [newItemText, setNewItemText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('normal');
  const [, startTransition] = useTransition();

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: TodoItemType = {
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        completed: false,
        createdAt: new Date()
      };

      const updatedList = {
        ...list,
        items: [...list.items, newItem],
        updatedAt: new Date()
      };

      // Use transition to make the update non-urgent and prevent interruptions
      startTransition(() => {
        onUpdateList(updatedList);
      });
      
      setNewItemText('');
    }
  };

  const updateItem = (updatedItem: TodoItemType) => {
    const updatedList = {
      ...list,
      items: list.items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ),
      updatedAt: new Date()
    };

    startTransition(() => {
      onUpdateList(updatedList);
    });
  };

  const deleteItem = (itemId: string) => {
    const updatedList = {
      ...list,
      items: list.items.filter(item => item.id !== itemId),
      updatedAt: new Date()
    };

    startTransition(() => {
      onUpdateList(updatedList);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem();
  };

  const completedCount = list.items.filter(item => item.completed).length;
  const totalCount = list.items.length;

  const sortedItems = useMemo(() => {
    const items = [...list.items];
    
    switch (sortBy) {
      case 'completed-top':
        return items.sort((a, b) => {
          if (a.completed && !b.completed) return -1;
          if (!a.completed && b.completed) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      
      case 'completed-bottom':
        return items.sort((a, b) => {
          if (!a.completed && b.completed) return -1;
          if (a.completed && !b.completed) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      
      case 'alphabetical':
        return items.sort((a, b) => a.text.localeCompare(b.text));
      
      case 'newest-first':
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      case 'oldest-first':
        return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      case 'normal':
      default:
        return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }, [list.items, sortBy]);

  return (
    <div className="todo-list">
      <div className="todo-list-header">
        <div className="todo-list-title">
          <h2>{list.name}</h2>
          <div className="todo-stats">
            {completedCount} of {totalCount} completed
          </div>
        </div>
        <div className="todo-sort">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="normal">Date Added</option>
            <option value="completed-top">Completed First</option>
            <option value="completed-bottom">Completed Last</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="newest-first">Newest First</option>
            <option value="oldest-first">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="add-item">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new item..."
          className="add-item-input"
        />
        <button onClick={handleAddClick} className="add-item-btn">
          Add
        </button>
      </div>

      <div className="todo-items">
        {sortedItems.length === 0 ? (
          <div className="empty-list">
            No items yet. Add your first item above!
          </div>
        ) : (
          sortedItems.map(item => (
            <TodoItem
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ))
        )}
      </div>
    </div>
  );
};