import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import type { SortOption } from '../types';
import { MoreVerticalIcon } from './icons';

type TodoViewMenuProps = {
  sortBy: SortOption;
  onChangeSort: (next: SortOption) => void;
};

const MENU_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: 'normal', label: 'Manual order' },
  { value: 'completed-top', label: 'Completed at top' },
  { value: 'completed-bottom', label: 'Completed at bottom' },
] as const;

function focusMenuItem(elements: readonly (HTMLButtonElement | null)[], index: number): void {
  const len = elements.length;
  if (len === 0) {
    return;
  }
  const i = ((index % len) + len) % len;
  elements[i]?.focus();
}

export function TodoViewMenu({ sortBy, onChangeSort }: TodoViewMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const close = useCallback((): void => {
    setOpen(false);
  }, []);

  const select = useCallback(
    (value: SortOption): void => {
      onChangeSort(value);
      close();
      triggerRef.current?.focus();
    },
    [close, onChangeSort],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: MouseEvent): void => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) {
        return;
      }
      close();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [close, open]);

  useEffect(() => {
    if (open) {
      const idx = MENU_OPTIONS.findIndex((o) => o.value === sortBy);
      window.requestAnimationFrame(() => {
        focusMenuItem(itemRefs.current, idx >= 0 ? idx : 0);
      });
    }
  }, [open, sortBy]);

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!open) {
      return;
    }
    const els = itemRefs.current;
    const currentIndex = els.findIndex((el) => el === document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusMenuItem(els, currentIndex < 0 ? 0 : currentIndex + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusMenuItem(els, currentIndex < 0 ? MENU_OPTIONS.length - 1 : currentIndex - 1);
    }
  };

  return (
    <div className="todo-view-menu">
      <button
        ref={triggerRef}
        type="button"
        className="btn btn--icon"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="List options and sort order"
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <MoreVerticalIcon size={20} />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Sort and view"
          className="todo-view-menu-panel"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
        >
          {MENU_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={sortBy === opt.value}
              className="todo-view-menu-item"
              onClick={() => {
                select(opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
