import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemGroup } from '../types';
import { normalizeAlias } from '../lib/matchItemsToGroups';
import { CancelIcon, DeleteIcon, GripIcon } from './icons';

export type SortableGroupingEditorRowProps = {
  group: ItemGroup;
  onChangeName: (id: string, name: string) => void;
  /** Fires on blur of the name input; consumers use this to persist. */
  onCommitName?: (id: string) => void;
  onAddAlias: (id: string, alias: string) => boolean;
  onRemoveAlias: (id: string, alias: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

export function SortableGroupingEditorRow({
  group,
  onChangeName,
  onCommitName,
  onAddAlias,
  onRemoveAlias,
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

  const [aliasDraft, setAliasDraft] = useState('');

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
    willChange: isDragging ? 'transform' : undefined,
  };

  const displayName = group.name.trim() || 'this group';

  const commitAlias = (): void => {
    const normalized = normalizeAlias(aliasDraft);
    if (!normalized) {
      setAliasDraft('');
      return;
    }
    const accepted = onAddAlias(group.id, normalized);
    if (accepted) {
      setAliasDraft('');
    }
  };

  const handleAliasKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitAlias();
      return;
    }
    if (e.key === 'Backspace' && aliasDraft.length === 0 && group.aliases.length > 0) {
      e.preventDefault();
      onRemoveAlias(group.id, group.aliases[group.aliases.length - 1]);
    }
  };

  return (
    <li ref={setNodeRef} style={style} className="grouping-editor-row-shell">
      <div className="card grouping-editor-row" aria-label={`Group ${displayName}`}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="drag-handle grouping-editor-row-handle"
          aria-label={`Reorder group ${displayName}`}
          {...attributes}
          {...listeners}
        >
          <GripIcon size={18} />
        </button>
        <div className="grouping-editor-row-content">
          <div className="grouping-editor-row-header">
            <input
              type="text"
              className="text-field grouping-editor-name-input"
              value={group.name}
              onChange={(e) => onChangeName(group.id, e.target.value)}
              onBlur={() => onCommitName?.(group.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              placeholder="Group name…"
              aria-label="Group name"
              autoComplete="off"
            />
            <button
              type="button"
              className="btn btn--icon btn--danger"
              aria-label={`Remove group ${displayName}`}
              disabled={!canRemove}
              title={!canRemove ? 'At least one group is required' : undefined}
              onClick={() => onRemove(group.id)}
            >
              <DeleteIcon size={18} />
            </button>
          </div>

          <div className="grouping-editor-aliases-row">
            <span className="eyebrow grouping-editor-aliases-label" aria-hidden="true">
              Also matches
            </span>
            <div
              className="grouping-editor-aliases"
              role="list"
              aria-label={`Aliases for ${displayName}`}
            >
              {group.aliases.map((alias) => (
                <span key={alias} role="listitem" className="grouping-editor-alias-chip">
                  <span className="grouping-editor-alias-chip-text">{alias}</span>
                  <button
                    type="button"
                    className="grouping-editor-alias-chip-remove"
                    aria-label={`Remove alias ${alias}`}
                    onClick={() => onRemoveAlias(group.id, alias)}
                  >
                    <CancelIcon size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="grouping-editor-alias-input"
                value={aliasDraft}
                onChange={(e) => setAliasDraft(e.target.value)}
                onKeyDown={handleAliasKeyDown}
                onBlur={commitAlias}
                placeholder={group.aliases.length === 0 ? 'e.g. carrot, broccoli' : 'add another…'}
                aria-label={`Add alias to ${displayName}`}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
