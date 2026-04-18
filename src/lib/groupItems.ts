import type { GroupingScheme, ItemGroup, TodoItem } from '../types';

export type GroupSection = {
  group: ItemGroup;
  items: TodoItem[];
};

const validGroupIds = (scheme: GroupingScheme): ReadonlySet<string> =>
  new Set(scheme.groups.map((g) => g.id));

export function resolveItemGroupId(item: TodoItem, scheme: GroupingScheme): string {
  const ids = validGroupIds(scheme);
  if (item.groupId !== undefined && ids.has(item.groupId)) {
    return item.groupId;
  }
  return scheme.defaultGroupId;
}

/** Partition sorted items into sections in scheme group order; omit empty sections. */
export function groupItems(sortedItems: readonly TodoItem[], scheme: GroupingScheme): GroupSection[] {
  const byGroup = new Map<string, TodoItem[]>();
  for (const g of scheme.groups) {
    byGroup.set(g.id, []);
  }
  for (const item of sortedItems) {
    const gid = resolveItemGroupId(item, scheme);
    const bucket = byGroup.get(gid);
    if (bucket) {
      bucket.push(item);
    } else {
      const fallback = byGroup.get(scheme.defaultGroupId);
      if (fallback) {
        fallback.push(item);
      }
    }
  }
  const out: GroupSection[] = [];
  for (const g of scheme.groups) {
    const items = byGroup.get(g.id) ?? [];
    if (items.length > 0) {
      out.push({ group: g, items });
    }
  }
  return out;
}
