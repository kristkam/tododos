import type { CSSProperties, ReactElement } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TodoItem as TodoItemType } from '../types';
import { TodoItem } from './TodoItem';
import { GripIcon } from './icons';

type SortableTodoItemProps = {
  item: TodoItemType;
  onUpdate: (item: TodoItemType) => void;
  onDelete: (itemId: string) => void;
};

export function SortableTodoItem({ item, onUpdate, onDelete }: SortableTodoItemProps): ReactElement {
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

  // Activator ref: listeners live on the handle while `setNodeRef` stays on the row (`<li>`).
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
      <TodoItem item={item} onUpdate={onUpdate} onDelete={onDelete} dragHandle={dragHandle} />
    </li>
  );
}
