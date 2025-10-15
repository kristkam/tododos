import React, { useState, useTransition } from 'react';
import type { TodoList as TodoListType, TodoItem as TodoItemType } from '../types';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ list, onUpdateList }) => {
  const [newItemText, setNewItemText] = useState('');
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="todo-list">
      <div className="todo-list-header">
        <h2>{list.name}</h2>
        <div className="todo-stats">
          {completedCount} of {totalCount} completed
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
        {list.items.length === 0 ? (
          <div className="empty-list">
            No items yet. Add your first item above!
          </div>
        ) : (
          list.items.map(item => (
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