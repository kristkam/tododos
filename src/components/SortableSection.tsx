import { useId, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRightIcon, GripIcon } from './icons';

type SortableSectionProps = {
  id: string;
  name: string;
  count: number;
  children: ReactNode;
};

export function SortableSection({ id, name, count, children }: SortableSectionProps): ReactElement {
  const itemsPanelId = useId();
  const [itemsExpanded, setItemsExpanded] = useState(true);

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
    transition: null,
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
        <button
          type="button"
          className="task-section-toggle"
          aria-expanded={itemsExpanded}
          aria-controls={itemsPanelId}
          onClick={() => {
            setItemsExpanded((v) => !v);
          }}
          aria-label={itemsExpanded ? `Collapse ${name} tasks` : `Expand ${name} tasks`}
        >
          <ChevronRightIcon
            size={18}
            className={`task-section-toggle-chevron${itemsExpanded ? ' task-section-toggle-chevron--expanded' : ''}`}
          />
        </button>
        <h3 className="task-section-title">
          <span className="task-section-title-text">{name}</span>
          <span className="task-section-count" aria-label={`${count} ${count === 1 ? 'item' : 'items'}`}>
            {count}
          </span>
        </h3>
      </header>
      <div id={itemsPanelId} className="task-section-items" hidden={!itemsExpanded}>
        {children}
      </div>
    </section>
  );
}
