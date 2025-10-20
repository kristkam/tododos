import React, { useState, useTransition, useMemo, useEffect } from 'react';
import type { TodoList as TodoListType, TodoItem as TodoItemType } from '../types';
import { TodoItem } from './TodoItem';
import { SortUnsortedIcon, SortCompletedTopIcon, SortCompletedBottomIcon } from './icons';

type SortOption = 'normal' | 'completed-top' | 'completed-bottom';

interface TodoListProps {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ list, onUpdateList }) => {
  const [newItemText, setNewItemText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(list.sortBy || 'normal');
  const [, startTransition] = useTransition();

  // Update sortBy when switching between different lists
  useEffect(() => {
    setSortBy(list.sortBy || 'normal');
  }, [list.id, list.sortBy]);

  const cycleSortOrder = () => {
    const nextSort: SortOption = 
      sortBy === 'normal' ? 'completed-top' :
      sortBy === 'completed-top' ? 'completed-bottom' :
      'normal';
    
    setSortBy(nextSort);
    
    // Update the list with the new sort preference
    const updatedList = {
      ...list,
      sortBy: nextSort,
      updatedAt: new Date()
    };

    startTransition(() => {
      onUpdateList(updatedList);
    });
  };

  const getSortIcon = () => {
    switch (sortBy) {
      case 'completed-top':
        return <SortCompletedTopIcon size={20} />;
      case 'completed-bottom':
        return <SortCompletedBottomIcon size={20} />;
      case 'normal':
      default:
        return <SortUnsortedIcon size={20} />;
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'completed-top':
        return 'Finished First';
      case 'completed-bottom':
        return 'Finished Last';
      case 'normal':
      default:
        return 'Unsorted';
    }
  };

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
          <div className="todo-meta">
            <div className="todo-stats">
              {completedCount} of {totalCount} completed
            </div>
            <button
              onClick={cycleSortOrder}
              className="sort-btn"
              title={`Currently: ${getSortLabel()}. Click to change sorting.`}
              aria-label={`Sort todos. Currently ${getSortLabel()}`}
            >
              {getSortIcon()}
            </button>
          </div>
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