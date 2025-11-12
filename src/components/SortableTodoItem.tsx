import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TodoItem as TodoItemType } from '../types';
import { TodoItem } from './TodoItem';

interface SortableTodoItemProps {
  item: TodoItemType;
  onUpdate: (item: TodoItemType) => void;
  onDelete: (itemId: string) => void;
}

export const SortableTodoItem: React.FC<SortableTodoItemProps> = ({
  item,
  onUpdate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
    willChange: isDragging ? 'transform' : undefined,
    pointerEvents: isDragging ? 'none' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TodoItem item={item} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  );
};
