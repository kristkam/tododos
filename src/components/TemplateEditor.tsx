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
import type { GroupingScheme, TemplateItem } from '../types';
import { newClientId } from '../lib/templateItems';
import { SortableTemplateEditorRow } from './SortableTemplateEditorRow';
import { CheckIcon } from './icons';

const TEMPLATE_GROUPING_SELECT_ID = 'template-editor-grouping';

export type TemplateEditorSubmitPayload = {
  name: string;
  items: TemplateItem[];
  groupingSchemeId?: string;
};

export type TemplateEditorProps = {
  initialName: string;
  initialItems: TemplateItem[];
  schemes: GroupingScheme[];
  /** When set, template is tied to this scheme (new saves it; edit keeps it read-only). */
  initialGroupingSchemeId?: string;
  /** If true, grouping scheme cannot be changed (edit flow with existing scheme). */
  groupingLocked?: boolean;
  submitLabel: string;
  onSubmit: (payload: TemplateEditorSubmitPayload) => void | Promise<void>;
  onCancel: () => void;
};

export function TemplateEditor({
  initialName,
  initialItems,
  schemes,
  initialGroupingSchemeId,
  groupingLocked = false,
  submitLabel,
  onSubmit,
  onCancel,
}: TemplateEditorProps): ReactElement {
  const [name, setName] = useState(initialName);
  const [items, setItems] = useState<TemplateItem[]>(initialItems);
  const [localSchemeId, setLocalSchemeId] = useState(initialGroupingSchemeId ?? '');
  const [newItemText, setNewItemText] = useState('');
  const addItemInputRef = useRef<HTMLInputElement>(null);
  const addItemSubmitRef = useRef<HTMLButtonElement>(null);

  const activeScheme = useMemo(
    () => (localSchemeId ? schemes.find((s) => s.id === localSchemeId) : undefined),
    [localSchemeId, schemes],
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

  const sortableScopeKey = useMemo(() => [...items.map((i) => i.id)].sort().join('|'), [items]);

  const handleSchemeChange = (nextId: string): void => {
    setLocalSchemeId(nextId);
    if (!nextId) {
      setItems((prev) =>
        prev.map((row) => {
          const next: TemplateItem = { id: row.id, text: row.text, order: row.order };
          return next;
        }),
      );
      return;
    }
    const sc = schemes.find((s) => s.id === nextId);
    if (!sc) {
      return;
    }
    setItems((prev) => prev.map((row) => ({ ...row, groupId: sc.defaultGroupId })));
  };

  const tryCommitNewItemFromRaw = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return false;
    }
    setItems((prev) => {
      const row: TemplateItem = {
        id: newClientId(),
        text: trimmed,
        order: prev.length,
      };
      if (activeScheme) {
        row.groupId = activeScheme.defaultGroupId;
      }
      return [...prev, row];
    });
    setNewItemText('');
    return true;
  };

  const addItem = (): void => {
    tryCommitNewItemFromRaw(newItemText);
  };

  const handleAddItemKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      addItem();
    }
  };

  const onAddItemBlur = (): void => {
    window.setTimeout(() => {
      if (addItemSubmitRef.current && document.activeElement === addItemSubmitRef.current) {
        return;
      }
      const raw = addItemInputRef.current?.value ?? '';
      tryCommitNewItemFromRaw(raw);
    }, 0);
  };

  const removeRow = (id: string): void => {
    setItems((prev) =>
      prev
        .filter((row) => row.id !== id)
        .map((row, index) => ({ ...row, order: index })),
    );
  };

  const updateText = (id: string, text: string): void => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, text } : row)));
  };

  const updateGroup = (id: string, groupId: string): void => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, groupId } : row)));
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setItems((prev) => {
      const oldIndex = prev.findIndex((row) => row.id === active.id);
      const newIndex = prev.findIndex((row) => row.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((row, index) => ({ ...row, order: index }));
    });
  };

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
        return;
      }
      const schemeForSubmit = localSchemeId ? schemes.find((s) => s.id === localSchemeId) : undefined;
      const trimmedRows = items
        .map((row) => ({ ...row, text: row.text.trim() }))
        .filter((row) => row.text.length > 0);

      let normalized: TemplateItem[] = trimmedRows.map((row, index) => ({
        id: row.id,
        text: row.text,
        order: index,
        ...(row.groupId !== undefined ? { groupId: row.groupId } : {}),
      }));

      if (schemeForSubmit) {
        normalized = normalized.map((row) => ({
          id: row.id,
          text: row.text,
          order: row.order,
          groupId:
            row.groupId !== undefined && schemeForSubmit.groups.some((g) => g.id === row.groupId)
              ? row.groupId
              : schemeForSubmit.defaultGroupId,
        }));
      } else {
        normalized = normalized.map((row) => ({
          id: row.id,
          text: row.text,
          order: row.order,
        }));
      }

      await Promise.resolve(
        onSubmit({
          name: trimmedName,
          items: normalized,
          groupingSchemeId: schemeForSubmit?.id,
        }),
      );
    },
    [items, localSchemeId, name, onSubmit, schemes],
  );

  const schemeNameLabel = activeScheme?.name ?? 'Unknown';

  return (
    <form className="template-editor" onSubmit={(e) => void handleSubmit(e)}>
      <div className="template-editor-field">
        <label htmlFor="template-editor-name" className="template-editor-label">
          Template name
        </label>
        <input
          id="template-editor-name"
          type="text"
          className="template-editor-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekly groceries"
          autoComplete="off"
          required
        />
      </div>

      {groupingLocked ? (
        <p className="template-editor-grouping-note" role="status">
          Grouping: {schemeNameLabel}
        </p>
      ) : (
        <div className="template-editor-field">
          <label htmlFor={TEMPLATE_GROUPING_SELECT_ID} className="template-editor-label">
            Grouping (optional)
          </label>
          <select
            id={TEMPLATE_GROUPING_SELECT_ID}
            className="template-editor-name-input"
            value={localSchemeId}
            onChange={(e) => handleSchemeChange(e.target.value)}
            disabled={schemes.length === 0}
          >
            <option value="">None</option>
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="template-editor-items-header">
        <span className="template-editor-label">Items</span>
      </div>

      <div className="add-task" aria-label="Add template item">
        <input
          ref={addItemInputRef}
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleAddItemKeyDown}
          onBlur={onAddItemBlur}
          placeholder="Add new item"
          aria-label="Add new item"
          enterKeyHint="done"
          inputMode="text"
          autoComplete="off"
        />
        <button
          ref={addItemSubmitRef}
          type="button"
          className="field-submit-btn"
          aria-label="Add item"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            addItem();
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
        {items.length === 0 ? (
          <div className="empty-list">No items yet. Add your first item above!</div>
        ) : (
          <SortableContext
            key={sortableScopeKey}
            items={items.map((row) => row.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="task-rows">
              {items.map((row) => (
                <SortableTemplateEditorRow
                  key={row.id}
                  item={row}
                  scheme={activeScheme}
                  onChangeText={updateText}
                  onChangeGroup={updateGroup}
                  onRemove={removeRow}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </DndContext>

      <div className="template-editor-actions">
        <button type="button" className="modal-btn cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="modal-btn primary-submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
