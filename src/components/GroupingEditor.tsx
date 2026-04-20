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
import {
  normalizeGroupAliases,
  validateGroupingSchemeDraft,
} from '../lib/groupingSchemeInvariants';
import { normalizeAlias } from '../lib/matchItemsToGroups';
import { SortableGroupingEditorRow } from './SortableGroupingEditorRow';
import { CheckIcon } from './icons';

export type GroupingEditorPayload = {
  name: string;
  groups: ItemGroup[];
};

export type GroupingEditorMode = 'create' | 'edit';

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: Date }
  | { kind: 'held' }
  | { kind: 'error' };

export type GroupingEditorProps = {
  mode: GroupingEditorMode;
  initialName: string;
  initialGroups: ItemGroup[];
  /** Create mode only: user pressed the primary submit. */
  onCreate?: (payload: GroupingEditorPayload) => void | Promise<void>;
  /** Edit mode only: persist the current valid draft. Return true on success. */
  onPatch?: (payload: GroupingEditorPayload) => Promise<boolean>;
  onCancel: () => void;
  onDone?: () => void;
};

function formatClockTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function GroupingEditor({
  mode,
  initialName,
  initialGroups,
  onCreate,
  onPatch,
  onCancel,
  onDone,
}: GroupingEditorProps): ReactElement {
  const [name, setName] = useState(initialName);
  const [groups, setGroups] = useState<ItemGroup[]>(initialGroups);
  const [newGroupText, setNewGroupText] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const addInputRef = useRef<HTMLInputElement>(null);
  const addSubmitRef = useRef<HTMLButtonElement>(null);
  const lastPersistedRef = useRef<string>('');

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
    () => validateGroupingSchemeDraft({ name, groups }),
    [name, groups],
  );

  const existingAliasSet = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      const nameKey = normalizeAlias(g.name);
      if (nameKey) set.add(nameKey);
      for (const a of g.aliases) {
        set.add(a);
      }
    }
    return set;
  }, [groups]);

  const persistIfEdit = useCallback(
    async (draft: GroupingEditorPayload): Promise<void> => {
      if (mode !== 'edit' || !onPatch) {
        return;
      }
      const trimmedName = draft.name.trim();
      const normalized = draft.groups.map(normalizeGroupAliases);
      if (validateGroupingSchemeDraft({ name: trimmedName, groups: normalized }) !== null) {
        setSaveStatus({ kind: 'held' });
        return;
      }
      const signature = JSON.stringify({ name: trimmedName, groups: normalized });
      if (signature === lastPersistedRef.current) {
        return;
      }
      setSaveStatus({ kind: 'saving' });
      const ok = await onPatch({ name: trimmedName, groups: normalized });
      if (ok) {
        lastPersistedRef.current = signature;
        setSaveStatus({ kind: 'saved', at: new Date() });
      } else {
        setSaveStatus({ kind: 'error' });
      }
    },
    [mode, onPatch],
  );

  const tryCommitNewGroup = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return false;
    }
    const next = [...groups, { id: newClientId(), name: trimmed, aliases: [] }];
    setGroups(next);
    setNewGroupText('');
    void persistIfEdit({ name, groups: next });
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

  const removeRow = (id: string): void => {
    if (groups.length <= 1) {
      return;
    }
    const next = groups.filter((g) => g.id !== id);
    setGroups(next);
    void persistIfEdit({ name, groups: next });
  };

  const updateName = (id: string, nextName: string): void => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name: nextName } : g)));
  };

  const commitGroupName = (id: string): void => {
    const next = groups.map((g) => (g.id === id ? { ...g, name: g.name.trim() } : g));
    if (next.some((g, i) => g.name !== groups[i].name)) {
      setGroups(next);
    }
    void persistIfEdit({ name, groups: next });
  };

  /** Returns false when the alias is a duplicate across groups (caller keeps the input). */
  const addAlias = (id: string, normalizedAlias: string): boolean => {
    if (!normalizedAlias) {
      return false;
    }
    if (existingAliasSet.has(normalizedAlias)) {
      return false;
    }
    const next = groups.map((g) =>
      g.id === id ? { ...g, aliases: [...g.aliases, normalizedAlias] } : g,
    );
    setGroups(next);
    void persistIfEdit({ name, groups: next });
    return true;
  };

  const removeAlias = (id: string, alias: string): void => {
    const next = groups.map((g) =>
      g.id === id ? { ...g, aliases: g.aliases.filter((a) => a !== alias) } : g,
    );
    setGroups(next);
    void persistIfEdit({ name, groups: next });
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const next = arrayMove(groups, oldIndex, newIndex);
    setGroups(next);
    void persistIfEdit({ name, groups: next });
  };

  const onSchemeNameBlur = (): void => {
    const trimmed = name.trim();
    if (trimmed !== name) {
      setName(trimmed);
    }
    void persistIfEdit({ name: trimmed, groups });
  };

  const handleCreateSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      if (mode !== 'create' || !onCreate) {
        return;
      }
      const trimmedName = name.trim();
      const normalized = groups.map(normalizeGroupAliases);
      if (validateGroupingSchemeDraft({ name: trimmedName, groups: normalized }) !== null) {
        return;
      }
      await Promise.resolve(onCreate({ name: trimmedName, groups: normalized }));
    },
    [groups, mode, name, onCreate],
  );

  const retry = (): void => {
    void persistIfEdit({ name, groups });
  };

  const canCreate = validationError === null;

  return (
    <form
      className="template-editor grouping-editor"
      onSubmit={(e) => void handleCreateSubmit(e)}
    >
      <div className="template-editor-field">
        <label htmlFor="grouping-editor-name" className="eyebrow">
          Grouping name
        </label>
        <input
          id="grouping-editor-name"
          type="text"
          className="text-field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={onSchemeNameBlur}
          placeholder="e.g. Weekly groceries"
          autoComplete="off"
          required
        />
      </div>

      <div className="template-editor-items-header">
        <span className="eyebrow">Groups</span>
      </div>

      <div className="card add-task" aria-label="Add group">
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
          <div className="empty-state">Add at least one group above.</div>
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
                  onChangeName={updateName}
                  onCommitName={commitGroupName}
                  onAddAlias={addAlias}
                  onRemoveAlias={removeAlias}
                  onRemove={removeRow}
                  canRemove={groups.length > 1}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </DndContext>

      {validationError && mode === 'create' ? (
        <p className="grouping-editor-validation" role="status">
          Fix validation errors before saving.
        </p>
      ) : null}

      {mode === 'edit' ? (
        <div className="grouping-editor-footer">
          <GroupingEditorSaveStatus status={saveStatus} onRetry={retry} />
          {onDone ? (
            <button type="button" className="btn btn--primary" onClick={onDone}>
              Done
            </button>
          ) : null}
        </div>
      ) : (
        <div className="template-editor-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={!canCreate}>
            Create grouping
          </button>
        </div>
      )}
    </form>
  );
}

type SaveStatusProps = {
  status: SaveStatus;
  onRetry: () => void;
};

function GroupingEditorSaveStatus({ status, onRetry }: SaveStatusProps): ReactElement {
  return (
    <div
      className={`grouping-editor-save-status grouping-editor-save-status-${status.kind}`}
      role="status"
      aria-live="polite"
    >
      {status.kind === 'idle' ? <span>All changes saved</span> : null}
      {status.kind === 'saving' ? <span>Saving…</span> : null}
      {status.kind === 'saved' ? <span>Saved · {formatClockTime(status.at)}</span> : null}
      {status.kind === 'held' ? (
        <span>Unsaved — fix validation errors to continue</span>
      ) : null}
      {status.kind === 'error' ? (
        <>
          <span>Couldn&apos;t save</span>
          <button type="button" className="btn btn--link" onClick={onRetry}>
            Retry
          </button>
        </>
      ) : null}
    </div>
  );
}
