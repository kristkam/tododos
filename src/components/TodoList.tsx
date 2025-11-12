import React, { useState, useTransition, useMemo, useEffect } from 'react';
import type { TodoList as TodoListType, TodoItem as TodoItemType } from '../types';
import { SortableTodoItem } from './SortableTodoItem';
import { SortUnsortedIcon, SortCompletedTopIcon, SortCompletedBottomIcon } from './icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

type SortOption = 'normal' | 'completed-top' | 'completed-bottom';

interface TodoListProps {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ list, onUpdateList }) => {
  const [newItemText, setNewItemText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(list.sortBy || 'normal');
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(list.items);

  // Configure sensors for drag and drop
  // PointerSensor with delay - must press and hold to start dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update sortBy when switching between different lists
  useEffect(() => {
    setSortBy(list.sortBy || 'normal');
  }, [list.id, list.sortBy]);

  // Sync items from props when list changes
  useEffect(() => {
    setItems(list.items);
  }, [list.id, list.items]);

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
      // Find the highest order value to append the new item at the end
      const maxOrder = list.items.reduce((max, item) => {
        const itemOrder = item.order ?? new Date(item.createdAt).getTime();
        return Math.max(max, itemOrder);
      }, -1);

      const newItem: TodoItemType = {
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        completed: false,
        createdAt: new Date(),
        order: maxOrder + 1
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

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  const sortedItems = useMemo(() => {
    const itemsArray = [...items];
    
    switch (sortBy) {
      case 'completed-top':
        return itemsArray.sort((a, b) => {
          if (a.completed && !b.completed) return -1;
          if (!a.completed && b.completed) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      
      case 'completed-bottom':
        return itemsArray.sort((a, b) => {
          if (!a.completed && b.completed) return -1;
          if (a.completed && !b.completed) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      
      case 'normal':
      default:
        // Use custom order if available, otherwise fall back to creation time
        return itemsArray.sort((a, b) => {
          const orderA = a.order ?? new Date(a.createdAt).getTime();
          const orderB = b.order ?? new Date(b.createdAt).getTime();
          return orderA - orderB;
        });
    }
  }, [items, sortBy]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex(item => item.id === active.id);
      const newIndex = sortedItems.findIndex(item => item.id === over.id);

      const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);

      // Assign order values to all items based on their new position
      const itemsWithOrder = reorderedItems.map((item, index) => ({
        ...item,
        order: index
      }));

      // Update local state immediately to prevent jumping
      setItems(itemsWithOrder);

      const updatedList = {
        ...list,
        items: itemsWithOrder,
        updatedAt: new Date()
      };

      // Update Firebase in background
      onUpdateList(updatedList);
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={sortedItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="todo-items">
            {sortedItems.length === 0 ? (
              <div className="empty-list">
                No items yet. Add your first item above!
              </div>
            ) : (
              sortedItems.map(item => (
                <SortableTodoItem
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};