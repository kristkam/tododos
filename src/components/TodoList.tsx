import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link } from 'react-router-dom';
import type { TodoList as TodoListType, TodoItem as TodoItemType, SortOption, GroupingScheme } from '../types';
import { SortableTodoItem } from './SortableTodoItem';
import { SortableSection } from './SortableSection';
import {
  CheckIcon,
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
import { useGroupings } from '../contexts/GroupingsContext';
import { matchItemsToGroups, type MatchResult } from '../lib/matchItemsToGroups';

type TodoListProps = {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void | Promise<void>;
  /** Optional controls shown in the header row next to sort (e.g. save as template). */
  headerActions?: ReactNode;
};

const GROUPING_PICKER_ID = 'todo-list-grouping-picker';
const GROUPING_PICKER_NONE = '';

function newTodoItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Reorder a subset of items while preserving their relative positions within the full list.
 * The reordered subset keeps the same set of `order` values, reassigned in the new positions.
 * Items outside the subset are unchanged.
 */
function reorderWithinSubset(
  all: readonly TodoItemType[],
  subsetIds: readonly string[],
  fromIndex: number,
  toIndex: number,
): TodoItemType[] {
  if (fromIndex === toIndex) {
    return [...all];
  }
  const subsetOrder = subsetIds.map((id) => {
    const item = all.find((i) => i.id === id);
    if (!item) {
      return 0;
    }
    return item.order ?? new Date(item.createdAt).getTime();
  });
  const reorderedIds = arrayMove([...subsetIds], fromIndex, toIndex);
  const slots = [...subsetOrder].sort((a, b) => a - b);
  const orderByItemId = new Map<string, number>();
  reorderedIds.forEach((id, idx) => {
    orderByItemId.set(id, slots[idx]);
  });
  return all.map((item) => {
    const nextOrder = orderByItemId.get(item.id);
    return nextOrder === undefined ? item : { ...item, order: nextOrder };
  });
}

export function TodoList({ list, onUpdateList, headerActions }: TodoListProps): ReactElement {
  const { schemes, loading: schemesLoading, reorderSchemeGroups } = useGroupings();
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

  const scheme: GroupingScheme | undefined = useMemo(() => {
    if (!list.activeGroupingId) {
      return undefined;
    }
    return schemes.find((s) => s.id === list.activeGroupingId);
  }, [list.activeGroupingId, schemes]);

  const schemeMissing = Boolean(list.activeGroupingId) && !scheme;

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

  const matched: MatchResult | null = useMemo(() => {
    if (!scheme) {
      return null;
    }
    return matchItemsToGroups(sortedItems, scheme, list.groupOrder);
  }, [scheme, sortedItems, list.groupOrder]);

  const visibleSections = useMemo(
    () => (matched ? matched.sections.filter((s) => s.items.length > 0) : []),
    [matched],
  );

  const canSaveOrderToScheme = useMemo(() => {
    if (!scheme || !list.groupOrder || list.groupOrder.length === 0) {
      return false;
    }
    const canonical = scheme.groups.map((g) => g.id);
    return !arraysEqual(canonical, list.groupOrder);
  }, [scheme, list.groupOrder]);

  const sortableScopeKey = useMemo(() => [...sortedItems.map((i) => i.id)].sort().join('|'), [sortedItems]);

  const runItemsMutation = useCallback(
    (action: TodoItemsOptimisticAction): void => {
      const nextItems = applyTodoItemsAction(optimisticItemsRef.current, action);
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
    startTransition(() => {
      void onUpdateList({
        ...list,
        sortBy: nextSort,
        updatedAt: new Date(),
      });
    });
  };

  const selectGrouping = (nextSchemeId: string): void => {
    const current = list.activeGroupingId ?? '';
    if (nextSchemeId === current) {
      return;
    }
    const next: TodoListType = {
      ...listRef.current,
      updatedAt: new Date(),
    };
    if (nextSchemeId === GROUPING_PICKER_NONE) {
      delete next.activeGroupingId;
      delete next.groupOrder;
    } else {
      next.activeGroupingId = nextSchemeId;
      delete next.groupOrder;
    }
    startTransition(() => {
      void onUpdateList(next);
    });
  };

  const persistGroupOrder = (order: string[]): void => {
    startTransition(() => {
      void onUpdateList({
        ...listRef.current,
        groupOrder: order,
        updatedAt: new Date(),
      });
    });
  };

  const handleSaveOrderToScheme = async (): Promise<void> => {
    if (!scheme || !list.groupOrder) {
      return;
    }
    const ok = await reorderSchemeGroups(scheme.id, list.groupOrder);
    if (ok) {
      startTransition(() => {
        const next: TodoListType = { ...listRef.current, updatedAt: new Date() };
        delete next.groupOrder;
        void onUpdateList(next);
      });
    }
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

  const onAddTaskBlur = (): void => {
    window.setTimeout(() => {
      if (addTaskSubmitRef.current && document.activeElement === addTaskSubmitRef.current) {
        return;
      }
      const raw = addTaskInputRef.current?.value ?? '';
      tryCommitNewItemFromRaw(raw);
    }, 0);
  };

  const completedCount = optimisticItems.filter((item) => item.completed).length;
  const totalCount = optimisticItems.length;

  const handleFlatDragEnd = (event: DragEndEvent, sorted: readonly TodoItemType[]): void => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sorted.findIndex((item) => item.id === active.id);
      const newIndex = sorted.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove([...sorted], oldIndex, newIndex);

      const itemsWithOrder = reorderedItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      runItemsMutation({ type: 'reorder', items: itemsWithOrder });
    }
  };

  const handleGroupedDragEnd = (event: DragEndEvent, result: MatchResult): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    if (active.data.current?.type === 'section') {
      const sectionIds = result.sections.map((s) => s.group.id);
      const from = sectionIds.indexOf(String(active.id));
      const to = sectionIds.indexOf(String(over.id));
      if (from < 0 || to < 0) {
        return;
      }
      const nextOrder = arrayMove([...sectionIds], from, to);
      persistGroupOrder(nextOrder);
      return;
    }

    const findContainer = (itemId: string): readonly TodoItemType[] | null => {
      for (const section of result.sections) {
        if (section.items.some((i) => i.id === itemId)) {
          return section.items;
        }
      }
      if (result.other.some((i) => i.id === itemId)) {
        return result.other;
      }
      return null;
    };

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }
    const subsetIds = activeContainer.map((i) => i.id);
    const fromIndex = subsetIds.indexOf(String(active.id));
    const toIndex = subsetIds.indexOf(String(over.id));
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return;
    }
    const nextItems = reorderWithinSubset(optimisticItemsRef.current, subsetIds, fromIndex, toIndex);
    runItemsMutation({ type: 'reorder', items: nextItems });
  };

  const onDragEnd = (event: DragEndEvent): void => {
    if (matched && scheme) {
      handleGroupedDragEnd(event, matched);
      return;
    }
    handleFlatDragEnd(event, sortedItems);
  };

  const activeGroupingValue = list.activeGroupingId ?? GROUPING_PICKER_NONE;

  return (
    <div className="todo-view">
      <header className="todo-view-header">
        <h1 className="todo-view-title">{list.name}</h1>
        <div className="todo-view-meta">
          <span className="todo-view-progress">
            {completedCount} of {totalCount} completed
          </span>
          <div className="todo-view-meta-actions">
            {headerActions}
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
        </div>

        <div className="todo-view-grouping">
          <label htmlFor={GROUPING_PICKER_ID} className="todo-view-grouping-label">
            Group by
          </label>
          <select
            id={GROUPING_PICKER_ID}
            className="todo-view-grouping-select"
            value={activeGroupingValue}
            onChange={(e) => selectGrouping(e.target.value)}
            disabled={schemesLoading}
            aria-busy={schemesLoading}
          >
            <option value={GROUPING_PICKER_NONE}>None</option>
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {canSaveOrderToScheme ? (
            <button
              type="button"
              className="todo-view-grouping-save-order"
              onClick={() => void handleSaveOrderToScheme()}
              title="Promote this list's group order to the scheme's default"
            >
              Save order to scheme
            </button>
          ) : null}
          {!schemesLoading && schemes.length === 0 ? (
            <span className="todo-view-grouping-hint">
              <Link to="/groupings">Create a grouping</Link> to use it here.
            </span>
          ) : null}
        </div>
      </header>

      {schemeMissing ? (
        <div className="todo-view-scheme-warning" role="alert">
          This list&apos;s grouping scheme was removed or is unavailable. The list is shown ungrouped until a
          scheme is selected.
        </div>
      ) : null}

      <form className="add-task" onSubmit={onAddTaskSubmit}>
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
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        {sortedItems.length === 0 ? (
          <div className="empty-list">No items yet. Add your first task above!</div>
        ) : matched && scheme ? (
          <div className="todo-grouped-sections">
            <SortableContext
              items={visibleSections.map((s) => s.group.id)}
              strategy={verticalListSortingStrategy}
            >
              {visibleSections.map((section) => (
                <SortableSection
                  key={section.group.id}
                  id={section.group.id}
                  name={section.group.name}
                  count={section.items.length}
                >
                  <ul className="task-rows">
                    <SortableContext
                      items={section.items.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {section.items.map((item) => (
                        <SortableTodoItem
                          key={item.id}
                          item={item}
                          onUpdate={updateItem}
                          onDelete={deleteItem}
                        />
                      ))}
                    </SortableContext>
                  </ul>
                </SortableSection>
              ))}
            </SortableContext>
            {matched.other.length > 0 ? (
              <section className="task-section task-section-other" aria-label="Other section">
                <header className="task-section-header task-section-header-static">
                  <h3 className="task-section-title">
                    <span className="task-section-title-text">Other</span>
                    <span
                      className="task-section-count"
                      aria-label={`${matched.other.length} ${matched.other.length === 1 ? 'item' : 'items'}`}
                    >
                      {matched.other.length}
                    </span>
                  </h3>
                </header>
                <ul className="task-rows">
                  <SortableContext
                    items={matched.other.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {matched.other.map((item) => (
                      <SortableTodoItem
                        key={item.id}
                        item={item}
                        onUpdate={updateItem}
                        onDelete={deleteItem}
                      />
                    ))}
                  </SortableContext>
                </ul>
              </section>
            ) : null}
          </div>
        ) : (
          <SortableContext
            key={sortableScopeKey}
            items={sortedItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="task-rows">
              {sortedItems.map((item) => (
                <SortableTodoItem
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </DndContext>
    </div>
  );
}
