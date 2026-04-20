import type { CSSProperties, ReactElement } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TemplateItem } from '../types';
import { DeleteIcon, GripIcon } from './icons';

type SortableTemplateEditorRowProps = {
  item: TemplateItem;
  onChangeText: (id: string, text: string) => void;
  onRemove: (id: string) => void;
};

export function SortableTemplateEditorRow({
  item,
  onChangeText,
  onRemove,
}: SortableTemplateEditorRowProps): ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
    willChange: isDragging ? 'transform' : undefined,
  };

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="drag-handle"
      aria-label={`Reorder ${item.text.trim() || 'item'}`}
      {...attributes}
      {...listeners}
    >
      <GripIcon size={18} />
    </button>
  );

  const removeLabel = item.text.trim() ? `Remove ${item.text.trim()}` : 'Remove item';

  return (
    <li ref={setNodeRef} style={style} className="sortable-task-row">
      <div className="task-row">
        {dragHandle}
        <input
          type="text"
          className="text-field task-row-edit"
          value={item.text}
          onChange={(e) => onChangeText(item.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          placeholder="Item text…"
          aria-label="Template item text"
          autoComplete="off"
        />
        <div className="task-row-actions">
          <button
            type="button"
            className="btn btn--icon btn--danger"
            aria-label={removeLabel}
            onClick={() => onRemove(item.id)}
          >
            <DeleteIcon size={18} />
          </button>
        </div>
      </div>
    </li>
  );
}
