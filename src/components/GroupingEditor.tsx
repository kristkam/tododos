import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
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
import type { ItemGroup } from '../types';
import { newClientId } from '../lib/templateItems';
import { validateGroupingSchemeDraft } from '../lib/groupingSchemeInvariants';
import { SortableGroupingEditorRow } from './SortableGroupingEditorRow';
import { CheckIcon } from './icons';
import { ConfirmModal } from './ConfirmModal';

export type GroupingEditorProps = {
  initialName: string;
  initialGroups: ItemGroup[];
  initialDefaultGroupId: string;
  submitLabel: string;
  /** When non-null, user must confirm before removing that group (e.g. in-use scheme). */
  buildRemoveGroupMessage?: (groupId: string) => string | null;
  onSubmit: (payload: { name: string; groups: ItemGroup[]; defaultGroupId: string }) => void | Promise<void>;
  onCancel: () => void;
};

export function GroupingEditor({
  initialName,
  initialGroups,
  initialDefaultGroupId,
  submitLabel,
  buildRemoveGroupMessage,
  onSubmit,
  onCancel,
}: GroupingEditorProps): ReactElement {
  const [name, setName] = useState(initialName);
  const [groups, setGroups] = useState<ItemGroup[]>(initialGroups);
  const [defaultGroupId, setDefaultGroupId] = useState(initialDefaultGroupId);
  const [newGroupText, setNewGroupText] = useState('');
  const [pendingRemove, setPendingRemove] = useState<{ id: string; message: string } | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const addSubmitRef = useRef<HTMLButtonElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortableScopeKey = useMemo(() => [...groups.map((g) => g.id)].sort().join('|'), [groups]);

  const validationError = useMemo(
    () =>
      validateGroupingSchemeDraft({
        name,
        groups,
        defaultGroupId,
      }),
    [name, groups, defaultGroupId],
  );

  const tryCommitNewGroup = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return false;
    }
    const id = newClientId();
    setGroups((prev) => {
      const next = [...prev, { id, name: trimmed }];
      if (prev.length === 0) {
        setDefaultGroupId(id);
      }
      return next;
    });
    setNewGroupText('');
    return true;
  };

  const addGroup = (): void => {
    tryCommitNewGroup(newGroupText);
  };

  const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      addGroup();
    }
  };

  const onAddBlur = (): void => {
    window.setTimeout(() => {
      if (addSubmitRef.current && document.activeElement === addSubmitRef.current) {
        return;
      }
      const raw = addInputRef.current?.value ?? '';
      tryCommitNewGroup(raw);
    }, 0);
  };

  const applyRemoveRow = (id: string): void => {
    setGroups((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const filtered = prev.filter((g) => g.id !== id);
      if (defaultGroupId === id && filtered[0]) {
        setDefaultGroupId(filtered[0].id);
      }
      return filtered;
    });
  };

  const requestRemoveRow = (id: string): void => {
    if (id === defaultGroupId) {
      return;
    }
    const extra = buildRemoveGroupMessage?.(id);
    if (extra) {
      setPendingRemove({ id, message: extra });
      return;
    }
    applyRemoveRow(id);
  };

  const updateName = (id: string, nextName: string): void => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name: nextName } : g)));
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setGroups((prev) => {
      const oldIndex = prev.findIndex((g) => g.id === active.id);
      const newIndex = prev.findIndex((g) => g.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (validateGroupingSchemeDraft({ name: trimmedName, groups, defaultGroupId }) !== null) {
        return;
      }
      const normalized = groups.map((g) => ({ id: g.id, name: g.name.trim() }));
      await Promise.resolve(onSubmit({ name: trimmedName, groups: normalized, defaultGroupId }));
    },
    [defaultGroupId, groups, name, onSubmit],
  );

  const canSubmit = validationError === null;

  return (
    <form className="template-editor grouping-editor" onSubmit={(e) => void handleSubmit(e)}>
      <div className="template-editor-field">
        <label htmlFor="grouping-editor-name" className="template-editor-label">
          Grouping name
        </label>
        <input
          id="grouping-editor-name"
          type="text"
          className="template-editor-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekly groceries"
          autoComplete="off"
          required
        />
      </div>

      <div className="template-editor-items-header">
        <span className="template-editor-label">Groups</span>
      </div>

      <div className="add-task" aria-label="Add group">
        <input
          ref={addInputRef}
          type="text"
          value={newGroupText}
          onChange={(e) => setNewGroupText(e.target.value)}
          onKeyDown={handleAddKeyDown}
          onBlur={onAddBlur}
          placeholder="Add new group"
          aria-label="Add new group"
          enterKeyHint="done"
          inputMode="text"
          autoComplete="off"
        />
        <button
          ref={addSubmitRef}
          type="button"
          className="field-submit-btn"
          aria-label="Add group"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            addGroup();
          }}
        >
          <CheckIcon size={18} color="currentColor" />
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        {groups.length === 0 ? (
          <div className="empty-list">Add at least one group above.</div>
        ) : (
          <SortableContext
            key={sortableScopeKey}
            items={groups.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="task-rows">
              {groups.map((g) => (
                <SortableGroupingEditorRow
                  key={g.id}
                  group={g}
                  isDefault={defaultGroupId === g.id}
                  onChangeName={updateName}
                  onSetDefault={setDefaultGroupId}
                  onRemove={requestRemoveRow}
                  canRemove={groups.length > 1 && g.id !== defaultGroupId}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </DndContext>

      {validationError ? (
        <p className="grouping-editor-validation" role="status">
          Fix validation errors before saving.
        </p>
      ) : null}

      <div className="template-editor-actions">
        <button type="button" className="modal-btn cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="modal-btn primary-submit" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>

      <ConfirmModal
        isOpen={pendingRemove !== null}
        title="Remove group"
        message={pendingRemove?.message ?? ''}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => {
          if (pendingRemove) {
            applyRemoveRow(pendingRemove.id);
          }
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </form>
  );
}
