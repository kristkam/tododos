import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactElement,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import type { TodoList as TodoListType, TodoItem as TodoItemType, SortOption } from '../types';
import { SortableTodoItem } from './SortableTodoItem';
import {
  CheckIcon,
  PlusIcon,
  SortUnsortedIcon,
  SortCompletedTopIcon,
  SortCompletedBottomIcon,
} from './icons';
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

function newTodoItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TodoList({ list, onUpdateList }: TodoListProps): ReactElement {
  const [newItemText, setNewItemText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(list.sortBy);
  const [, startTransition] = useTransition();
  const addTaskInputRef = useRef<HTMLInputElement>(null);
  const addTaskSubmitRef = useRef<HTMLButtonElement>(null);

  const [optimisticItems, addOptimisticItems] = useOptimistic(list.items, applyTodoItemsAction);

  const listRef = useRef(list);
  const optimisticItemsRef = useRef(optimisticItems);
  listRef.current = list;
  optimisticItemsRef.current = optimisticItems;

  /* Distance (not delay): with delay, mouse users who drag the handle immediately never
     activate the sensor; touch long-press still worked. */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setSortBy(list.sortBy);
  }, [list.id, list.sortBy]);

  const sortedItems = useMemo(() => sortItems(optimisticItems, sortBy), [optimisticItems, sortBy]);

  /** Remount SortableContext when the id set changes (add/remove), not when order changes. */
  const sortableScopeKey = useMemo(() => [...sortedItems.map((i) => i.id)].sort().join('|'), [sortedItems]);

  const runItemsMutation = useCallback(
    (action: TodoItemsOptimisticAction): void => {
      const nextItems = applyTodoItemsAction(optimisticItemsRef.current, action);
      /* Must not defer: if addOptimisticItems only runs inside startTransition, the new row can
         mount before SortableContext's `items` includes its id (useSortable index -1 → no drag). */
      addOptimisticItems(action);
      startTransition(() => {
        void onUpdateList({
          ...listRef.current,
          items: nextItems,
          updatedAt: new Date(),
        });
      });
    },
    [addOptimisticItems, onUpdateList, startTransition],
  );

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

  const getSortIcon = (): ReactElement => {
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

  const tryCommitNewItemFromRaw = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return false;
    }

    const items = optimisticItemsRef.current;
    const maxOrder = items.reduce((max, item) => {
      const itemOrder = item.order ?? new Date(item.createdAt).getTime();
      return Math.max(max, itemOrder);
    }, -1);

    const newItem: TodoItemType = {
      id: newTodoItemId(),
      text: trimmed,
      completed: false,
      createdAt: new Date(),
      order: maxOrder + 1,
    };

    runItemsMutation({ type: 'add', item: newItem });
    setNewItemText('');
    return true;
  };

  const addItem = (): void => {
    tryCommitNewItemFromRaw(newItemText);
  };

  const updateItem = (updatedItem: TodoItemType): void => {
    runItemsMutation({ type: 'update', item: updatedItem });
  };

  const deleteItem = (itemId: string): void => {
    runItemsMutation({ type: 'delete', itemId });
  };

  const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const onAddTaskSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    addItem();
  };

  /** iOS "Done" on the keyboard often blurs without submitting the form. */
  const onAddTaskBlur = (): void => {
    window.setTimeout(() => {
      if (addTaskSubmitRef.current && document.activeElement === addTaskSubmitRef.current) {
        return;
      }
      // Read live value so we do not re-commit stale text after a successful submit in the same gesture.
      const raw = addTaskInputRef.current?.value ?? '';
      tryCommitNewItemFromRaw(raw);
    }, 0);
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
    <div className="todo-view">
      <header className="todo-view-header">
        <h1 className="todo-view-title">{list.name}</h1>
        <div className="todo-view-meta">
          <span className="todo-view-progress">
            {completedCount} of {totalCount} completed
          </span>
          <button
            type="button"
            onClick={cycleSortOrder}
            className="icon-btn"
            title={`Currently: ${getSortLabel()}. Click to change sorting.`}
            aria-label={`Sort todos. Currently ${getSortLabel()}`}
          >
            {getSortIcon()}
          </button>
        </div>
      </header>

      <form className="add-task" onSubmit={onAddTaskSubmit}>
        <PlusIcon size={22} color="var(--color-text-muted)" />
        <input
          ref={addTaskInputRef}
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleAddKeyDown}
          onBlur={onAddTaskBlur}
          placeholder="Add new task"
          aria-label="Add new task"
          enterKeyHint="done"
          inputMode="text"
          autoComplete="off"
        />
        <button
          ref={addTaskSubmitRef}
          type="submit"
          className="field-submit-btn"
          aria-label="Add task"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        >
          <CheckIcon size={18} color="currentColor" />
        </button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        {sortedItems.length === 0 ? (
          <div className="empty-list">No items yet. Add your first task above!</div>
        ) : (
            <SortableContext
              key={sortableScopeKey}
              items={sortedItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
            <ul className="task-rows">
              {sortedItems.map((item) => (
                <SortableTodoItem key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
              ))}
            </ul>
          </SortableContext>
        )}
      </DndContext>
    </div>
  );
}
