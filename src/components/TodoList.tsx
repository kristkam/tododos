import {
  Fragment,
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
import {
  CheckIcon,
  SortUnsortedIcon,
  SortCompletedTopIcon,
  SortCompletedBottomIcon,
  GroupBySectionsIcon,
} from './icons';
import {
  DndContext,
  closestCenter,
  closestCorners,
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
import { groupItems } from '../lib/groupItems';
import { applyGroupedDragReorder } from '../lib/applyGroupedDragReorder';
import type { TodoItemGroupOption } from './TodoItem';

type TodoListProps = {
  list: TodoListType;
  onUpdateList: (list: TodoListType) => void | Promise<void>;
  /** Optional controls shown in the header row next to sort (e.g. save as template). */
  headerActions?: ReactNode;
};

function newTodoItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const ATTACH_SCHEME_SELECT_ID = 'todo-list-attach-scheme';

export function TodoList({ list, onUpdateList, headerActions }: TodoListProps): ReactElement {
  const { schemes, loading: schemesLoading } = useGroupings();
  const [newItemText, setNewItemText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(list.sortBy);
  const [groupByView, setGroupByView] = useState(list.groupBy);
  const [attachSchemeDraftId, setAttachSchemeDraftId] = useState('');
  const [, startTransition] = useTransition();
  const addTaskInputRef = useRef<HTMLInputElement>(null);
  const addTaskSubmitRef = useRef<HTMLButtonElement>(null);

  const [optimisticItems, addOptimisticItems] = useOptimistic(list.items, applyTodoItemsAction);

  const listRef = useRef(list);
  const optimisticItemsRef = useRef(optimisticItems);
  listRef.current = list;
  optimisticItemsRef.current = optimisticItems;

  const scheme: GroupingScheme | undefined = useMemo(() => {
    if (!list.groupingSchemeId) {
      return undefined;
    }
    return schemes.find((s) => s.id === list.groupingSchemeId);
  }, [list.groupingSchemeId, schemes]);

  const schemeMissing = Boolean(list.groupingSchemeId) && !scheme;
  const groupOptions: readonly TodoItemGroupOption[] | undefined = useMemo(
    () => (scheme ? scheme.groups.map((g) => ({ id: g.id, name: g.name })) : undefined),
    [scheme],
  );

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

  useEffect(() => {
    setGroupByView(list.groupBy);
  }, [list.id, list.groupBy]);

  useEffect(() => {
    if (list.groupingSchemeId) {
      setAttachSchemeDraftId('');
    }
  }, [list.groupingSchemeId, list.id]);

  const sortedItems = useMemo(() => sortItems(optimisticItems, sortBy), [optimisticItems, sortBy]);

  const groupedSections = useMemo(() => {
    if (!scheme || !groupByView || schemeMissing) {
      return null;
    }
    return groupItems(sortedItems, scheme);
  }, [groupByView, scheme, schemeMissing, sortedItems]);

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

    const updatedList: TodoListType = {
      ...list,
      sortBy: nextSort,
      updatedAt: new Date(),
    };

    startTransition(() => {
      void onUpdateList(updatedList);
    });
  };

  const applyAttachedScheme = (): void => {
    const sid = attachSchemeDraftId.trim();
    const sc = schemes.find((s) => s.id === sid);
    if (!sc) {
      return;
    }
    const nextItems = optimisticItemsRef.current.map((item) => ({
      ...item,
      groupId: sc.defaultGroupId,
    }));
    startTransition(() => {
      void onUpdateList({
        ...listRef.current,
        groupingSchemeId: sc.id,
        items: nextItems,
        updatedAt: new Date(),
      });
    });
    setAttachSchemeDraftId('');
  };

  const toggleGroupByView = (): void => {
    if (!list.groupingSchemeId || schemeMissing) {
      return;
    }
    const next = !groupByView;
    setGroupByView(next);
    startTransition(() => {
      void onUpdateList({
        ...listRef.current,
        groupBy: next,
        updatedAt: new Date(),
      });
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
      ...(scheme && !schemeMissing ? { groupId: scheme.defaultGroupId } : {}),
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

  const handleGroupedDragEnd = (event: DragEndEvent, sectionsInput: ReturnType<typeof groupItems>): void => {
    const { active, over } = event;
    if (!over || !scheme) {
      return;
    }
    const nextItems = applyGroupedDragReorder(sectionsInput, String(active.id), String(over.id));
    if (!nextItems) {
      return;
    }
    runItemsMutation({ type: 'reorder', items: nextItems });
  };

  const onDragEnd = (event: DragEndEvent): void => {
    const sorted = sortItems(optimisticItemsRef.current, sortBy);
    if (groupByView && scheme && !schemeMissing) {
      handleGroupedDragEnd(event, groupItems(sorted, scheme));
      return;
    }
    handleFlatDragEnd(event, sorted);
  };

  const groupedDragCollision =
    Boolean(groupByView && scheme && !schemeMissing) && groupedSections !== null;

  const groupByDisabled = !list.groupingSchemeId || schemeMissing;
  const groupByTitle = groupByDisabled
    ? schemeMissing
      ? 'Grouping scheme unavailable'
      : 'This list has no grouping scheme'
    : groupByView
      ? 'Grouped view on. Click to show a flat list.'
      : 'Grouped view off. Click to organize by group.';

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
              onClick={toggleGroupByView}
              className="icon-btn"
              disabled={groupByDisabled}
              title={groupByTitle}
              aria-label={`Group by sections. ${groupByView ? 'On' : 'Off'}`}
              aria-pressed={groupByView}
            >
              <GroupBySectionsIcon size={20} />
            </button>
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

        {!list.groupingSchemeId ? (
          <div className="todo-view-attach-grouping">
            <label htmlFor={ATTACH_SCHEME_SELECT_ID} className="todo-view-attach-grouping-label">
              Add grouping
            </label>
            <select
              id={ATTACH_SCHEME_SELECT_ID}
              className="todo-view-attach-grouping-select"
              value={attachSchemeDraftId}
              onChange={(e) => setAttachSchemeDraftId(e.target.value)}
              disabled={schemesLoading || schemes.length === 0}
              aria-busy={schemesLoading}
            >
              <option value="">Choose a grouping…</option>
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="todo-view-attach-grouping-apply"
              disabled={!attachSchemeDraftId || schemesLoading}
              onClick={() => applyAttachedScheme()}
            >
              Apply
            </button>
            {!schemesLoading && schemes.length === 0 ? (
              <span className="todo-view-attach-grouping-hint">
                <Link to="/groupings">Create a grouping</Link> to use it here.
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {schemeMissing ? (
        <div className="todo-view-scheme-warning" role="alert">
          This list&apos;s grouping scheme was removed or is unavailable. Group view and per-item groups are
          disabled until the scheme exists again.
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
        collisionDetection={groupedDragCollision ? closestCorners : closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        {sortedItems.length === 0 ? (
          <div className="empty-list">No items yet. Add your first task above!</div>
        ) : groupedSections && scheme ? (
          <div className="todo-grouped-sections">
            {groupedSections.map((section) => (
              <Fragment key={section.group.id}>
                <div className="task-section-header">
                  <h3 className="task-section-title">{section.group.name}</h3>
                </div>
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
                        groupOptions={groupOptions}
                        groupPickerDisabled={schemeMissing}
                      />
                    ))}
                  </SortableContext>
                </ul>
              </Fragment>
            ))}
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
                  groupOptions={groupOptions}
                  groupPickerDisabled={schemeMissing}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </DndContext>
    </div>
  );
}
