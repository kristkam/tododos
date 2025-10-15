import React, { useState, useOptimistic } from 'react';
import type { TodoList as TodoListType, TodoItem as TodoItemType } from '../types';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ list, onUpdateList }) => {
  const [newItemText, setNewItemText] = useState('');

  // Optimistic state for items to prevent flickering
  const [optimisticItems, addOptimisticItem] = useOptimistic(
    list.items,
    (state: TodoItemType[], action: { type: 'add' | 'update' | 'delete', item?: TodoItemType, itemId?: string }) => {
      switch (action.type) {
        case 'add':
          return action.item ? [...state, action.item] : state;
        case 'update':
          return action.item ? state.map(item => item.id === action.item!.id ? action.item! : item) : state;
        case 'delete':
          return action.itemId ? state.filter(item => item.id !== action.itemId) : state;
        default:
          return state;
      }
    }
  );

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: TodoItemType = {
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        completed: false,
        createdAt: new Date()
      };

      // Optimistically add the item immediately
      addOptimisticItem({ type: 'add', item: newItem });

      const updatedList = {
        ...list,
        items: [...list.items, newItem],
        updatedAt: new Date()
      };

      onUpdateList(updatedList);
      setNewItemText('');
    }
  };

  const updateItem = (updatedItem: TodoItemType) => {
    // Optimistically update the item immediately
    addOptimisticItem({ type: 'update', item: updatedItem });

    const updatedList = {
      ...list,
      items: list.items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ),
      updatedAt: new Date()
    };

    onUpdateList(updatedList);
  };

  const deleteItem = (itemId: string) => {
    // Optimistically delete the item immediately
    addOptimisticItem({ type: 'delete', itemId });

    const updatedList = {
      ...list,
      items: list.items.filter(item => item.id !== itemId),
      updatedAt: new Date()
    };

    onUpdateList(updatedList);
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

  const completedCount = optimisticItems.filter(item => item.completed).length;
  const totalCount = optimisticItems.length;

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
        {optimisticItems.length === 0 ? (
          <div className="empty-list">
            No items yet. Add your first item above!
          </div>
        ) : (
          optimisticItems.map(item => (
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