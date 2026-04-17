import React, { useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';
import type { TodoList as TodoListType, TodoItem as TodoItemType, SortOption } from '../types';
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
import { sortItems } from '../lib/sortItems';
import { applyTodoItemsAction, type TodoItemsOptimisticAction } from '../lib/todoItemsReducer';

type TodoListProps = {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void | Promise<void>;
};

export const TodoList: React.FC<TodoListProps> = ({ list, onUpdateList }) => {
  const [newItemText, setNewItemText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(list.sortBy);
  const [, startTransition] = useTransition();

  const [optimisticItems, addOptimisticItems] = useOptimistic(list.items, applyTodoItemsAction);

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

  useEffect(() => {
    setSortBy(list.sortBy);
  }, [list.id, list.sortBy]);

  const sortedItems = useMemo(() => sortItems(optimisticItems, sortBy), [optimisticItems, sortBy]);

  const cycleSortOrder = (): void => {
    const nextSort: SortOption =
      sortBy === 'normal' ? 'completed-top' : sortBy === 'completed-top' ? 'completed-bottom' : 'normal';

    setSortBy(nextSort);

    const updatedList: TodoListType = {
      ...list,
      sortBy: nextSort,
      updatedAt: new Date(),
    };

    startTransition(() => {
      void onUpdateList(updatedList);
    });
  };

  const getSortIcon = (): React.ReactElement => {
    switch (sortBy) {
      case 'completed-top':
        return <SortCompletedTopIcon size={20} />;
      case 'completed-bottom':
        return <SortCompletedBottomIcon size={20} />;
      case 'normal':
        return <SortUnsortedIcon size={20} />;
    }
  };

  const getSortLabel = (): string => {
    switch (sortBy) {
      case 'completed-top':
        return 'Finished First';
      case 'completed-bottom':
        return 'Finished Last';
      case 'normal':
        return 'Unsorted';
    }
  };

  const runItemsMutation = (action: TodoItemsOptimisticAction): void => {
    const nextItems = applyTodoItemsAction(optimisticItems, action);
    startTransition(() => {
      addOptimisticItems(action);
      void onUpdateList({
        ...list,
        items: nextItems,
        updatedAt: new Date(),
      });
    });
  };

  const addItem = (): void => {
    const trimmed = newItemText.trim();
    if (!trimmed) {
      return;
    }

    const maxOrder = optimisticItems.reduce((max, item) => {
      const itemOrder = item.order ?? new Date(item.createdAt).getTime();
      return Math.max(max, itemOrder);
    }, -1);

    const newItem: TodoItemType = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdAt: new Date(),
      order: maxOrder + 1,
    };

    runItemsMutation({ type: 'add', item: newItem });
    setNewItemText('');
  };

  const updateItem = (updatedItem: TodoItemType): void => {
    runItemsMutation({ type: 'update', item: updatedItem });
  };

  const deleteItem = (itemId: string): void => {
    runItemsMutation({ type: 'delete', itemId });
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const handleAddClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    addItem();
  };

  const completedCount = optimisticItems.filter((item) => item.completed).length;
  const totalCount = optimisticItems.length;

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);

      const itemsWithOrder = reorderedItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      runItemsMutation({ type: 'reorder', items: itemsWithOrder });
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
              type="button"
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
        <button type="button" onClick={handleAddClick} className="add-item-btn">
          Add
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={sortedItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="todo-items">
            {sortedItems.length === 0 ? (
              <div className="empty-list">No items yet. Add your first item above!</div>
            ) : (
              sortedItems.map((item) => (
                <SortableTodoItem key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
