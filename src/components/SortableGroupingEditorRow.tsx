import type { CSSProperties, ReactElement } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemGroup } from '../types';
import { DeleteIcon, GripIcon } from './icons';

export type SortableGroupingEditorRowProps = {
  group: ItemGroup;
  isDefault: boolean;
  onChangeName: (id: string, name: string) => void;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

export function SortableGroupingEditorRow({
  group,
  isDefault,
  onChangeName,
  onSetDefault,
  onRemove,
  canRemove,
}: SortableGroupingEditorRowProps): ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

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
      aria-label={`Reorder group ${group.name.trim() || 'group'}`}
      {...attributes}
      {...listeners}
    >
      <GripIcon size={18} />
    </button>
  );

  return (
    <li ref={setNodeRef} style={style} className="sortable-task-row">
      <div className="task-row grouping-editor-row">
        {dragHandle}
        <label className="grouping-editor-default">
          <input
            type="radio"
            name="default-group"
            checked={isDefault}
            onChange={() => onSetDefault(group.id)}
            aria-label={`Set ${group.name.trim() || 'group'} as default for new items`}
          />
          <span className="grouping-editor-default-label">Default</span>
        </label>
        <input
          type="text"
          className="task-row-edit"
          value={group.name}
          onChange={(e) => onChangeName(group.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          placeholder="Group name…"
          aria-label="Group name"
          autoComplete="off"
        />
        <div className="task-row-actions">
          <button
            type="button"
            className="icon-btn icon-btn-danger"
            aria-label={`Remove group ${group.name.trim() || group.id}`}
            disabled={!canRemove}
            title={!canRemove ? 'At least one group is required' : undefined}
            onClick={() => onRemove(group.id)}
          >
            <DeleteIcon size={18} />
          </button>
        </div>
      </div>
    </li>
  );
}
