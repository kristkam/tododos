import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripIcon } from './icons';

type SortableSectionProps = {
  id: string;
  name: string;
  count: number;
  children: ReactNode;
};

export function SortableSection({ id, name, count, children }: SortableSectionProps): ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: 'section' },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 2 : 0,
    position: 'relative',
    willChange: isDragging ? 'transform' : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <section ref={setNodeRef} style={style} className="task-section" aria-label={`${name} section`}>
      <header className="task-section-header">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="drag-handle task-section-drag-handle"
          aria-label={`Reorder ${name} section`}
          {...attributes}
          {...listeners}
        >
          <GripIcon size={18} />
        </button>
        <h3 className="task-section-title">
          <span className="task-section-title-text">{name}</span>
          <span className="task-section-count" aria-label={`${count} ${count === 1 ? 'item' : 'items'}`}>
            {count}
          </span>
        </h3>
      </header>
      {children}
    </section>
  );
}
