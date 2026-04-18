import { arrayMove } from '@dnd-kit/sortable';
import type { TodoItem } from '../types';
import type { GroupSection } from './groupItems';

/**
 * Applies a drag-drop between sortable todo rows in grouped view.
 * Supports reorder within a section and moves across sections (updates `groupId`).
 * Returns null when the drop should be ignored (no-op or invalid targets).
 */
export function applyGroupedDragReorder(
  sections: readonly GroupSection[],
  activeId: string,
  overId: string,
): TodoItem[] | null {
  if (activeId === overId) {
    return null;
  }

  const findSectionIndex = (itemId: string): number =>
    sections.findIndex((s) => s.items.some((i) => i.id === itemId));

  const sActive = findSectionIndex(activeId);
  const sOver = findSectionIndex(overId);

  if (sActive < 0 || sOver < 0) {
    return null;
  }

  const mutable: GroupSection[] = sections.map((sec) => ({
    ...sec,
    items: [...sec.items],
  }));

  const secA = mutable[sActive];
  const oldIdx = secA.items.findIndex((i) => i.id === activeId);
  if (oldIdx < 0) {
    return null;
  }

  if (sActive === sOver) {
    const newIdx = secA.items.findIndex((i) => i.id === overId);
    if (newIdx < 0) {
      return null;
    }
    if (oldIdx === newIdx) {
      return null;
    }
    const reordered = arrayMove(secA.items, oldIdx, newIdx);
    mutable[sActive] = { ...secA, items: reordered };
  } else {
    const [moved] = secA.items.splice(oldIdx, 1);
    const secB = mutable[sOver];
    const newIdx = secB.items.findIndex((i) => i.id === overId);
    if (newIdx < 0) {
      return null;
    }
    const withGroup: TodoItem = { ...moved, groupId: secB.group.id };
    secB.items.splice(newIdx, 0, withGroup);
  }

  const flat = mutable.flatMap((s) => s.items);
  return flat.map((item, index) => ({
    ...item,
    order: index,
  }));
}
