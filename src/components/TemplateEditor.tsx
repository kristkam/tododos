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
import type { TemplateItem } from '../types';
import { newClientId } from '../lib/templateItems';
import { SortableTemplateEditorRow } from './SortableTemplateEditorRow';
import { CheckIcon } from './icons';

export type TemplateEditorProps = {
  initialName: string;
  initialItems: TemplateItem[];
  submitLabel: string;
  onSubmit: (payload: { name: string; items: TemplateItem[] }) => void | Promise<void>;
  onCancel: () => void;
};

export function TemplateEditor({
  initialName,
  initialItems,
  submitLabel,
  onSubmit,
  onCancel,
}: TemplateEditorProps): ReactElement {
  const [name, setName] = useState(initialName);
  const [items, setItems] = useState<TemplateItem[]>(initialItems);
  const [newItemText, setNewItemText] = useState('');
  const addItemInputRef = useRef<HTMLInputElement>(null);
  const addItemSubmitRef = useRef<HTMLButtonElement>(null);

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

  const tryCommitNewItemFromRaw = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return false;
    }
    setItems((prev) => [...prev, { id: newClientId(), text: trimmed, order: prev.length }]);
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

  /** iOS "Done" on the keyboard often blurs without an explicit submit. */
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
      const normalized = items
        .map((row) => ({ ...row, text: row.text.trim() }))
        .filter((row) => row.text.length > 0)
        .map((row, index) => ({ ...row, order: index }));
      await Promise.resolve(onSubmit({ name: trimmedName, items: normalized }));
    },
    [items, name, onSubmit],
  );

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

      <div className="template-editor-items-header">
        <span className="template-editor-label">Items</span>
      </div>

      {/* Not a nested <form>: invalid HTML. Same layout and behavior as TodoList add-task. */}
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
                  onChangeText={updateText}
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
