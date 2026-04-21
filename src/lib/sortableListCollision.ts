import {
  closestCorners,
  pointerWithin,
  type Active,
  type CollisionDetection,
  type DroppableContainer,
} from '@dnd-kit/core';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readPayload(data: Active['data'] | DroppableContainer['data']): {
  type?: string;
  sortable?: { containerId?: unknown };
} | undefined {
  const cur = data.current;
  if (!isRecord(cur)) {
    return undefined;
  }
  const sortable = cur.sortable;
  const sortableObj = isRecord(sortable) ? sortable : undefined;
  const typeRaw = cur.type;
  return {
    type: typeof typeRaw === 'string' ? typeRaw : undefined,
    sortable: sortableObj ? { containerId: sortableObj.containerId } : undefined,
  };
}

function narrowDroppables(active: Active, droppables: DroppableContainer[]): DroppableContainer[] {
  const activePayload = readPayload(active.data);
  const kind = activePayload?.type;
  if (kind === 'section') {
    return droppables.filter((c) => readPayload(c.data)?.type === 'section');
  }
  if (kind === 'item') {
    const containerId = activePayload?.sortable?.containerId;
    if (containerId === undefined) {
      return droppables.filter((c) => readPayload(c.data)?.type === 'item');
    }
    return droppables.filter((c) => {
      const p = readPayload(c.data);
      return p?.type === 'item' && p.sortable?.containerId === containerId;
    });
  }
  return droppables;
}

/**
 * `closestCenter` oscillates when only a few short rows exist. Prefer rectangles that contain
 * the pointer; in flex gaps, fall back to corner distance. Scope droppables so section drags do
 * not collide with task rows (and tasks only see their own `SortableContext`).
 */
export const sortablePointerFirstCollision: CollisionDetection = (args) => {
  const narrowed = narrowDroppables(args.active, args.droppableContainers);
  const scoped = { ...args, droppableContainers: narrowed };
  const pointerHits = pointerWithin(scoped);
  if (pointerHits.length > 0) {
    return pointerHits;
  }
  return closestCorners(scoped);
};
