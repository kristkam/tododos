import type { CSSProperties, ReactElement } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TodoItem as TodoItemType } from '../types';
import { TodoItem, type TodoItemGroupOption } from './TodoItem';
import { GripIcon } from './icons';

type SortableTodoItemProps = {
  item: TodoItemType;
  onUpdate: (item: TodoItemType) => void;
  onDelete: (itemId: string) => void;
  groupOptions?: readonly TodoItemGroupOption[];
  groupPickerDisabled?: boolean;
};

export function SortableTodoItem({
  item,
  onUpdate,
  onDelete,
  groupOptions,
  groupPickerDisabled,
}: SortableTodoItemProps): ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

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
      aria-label={`Reorder ${item.text}`}
      {...attributes}
      {...listeners}
    >
      <GripIcon size={18} />
    </button>
  );

  return (
    <li ref={setNodeRef} style={style} className="sortable-task-row">
      <TodoItem
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandle={dragHandle}
        groupOptions={groupOptions}
        groupPickerDisabled={groupPickerDisabled}
      />
    </li>
  );
}
