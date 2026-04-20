import type { GroupingScheme, ItemGroup, TodoItem } from '../types';

export type GroupSection = {
  group: ItemGroup;
  items: TodoItem[];
};

export type MatchResult = {
  sections: GroupSection[];
  other: TodoItem[];
};

/** Canonical form used for alias equality: trim + lowercase + collapse internal whitespace. */
export function normalizeAlias(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Build an alias -> groupId lookup. First group that claims an alias wins (scheme order). */
function buildAliasIndex(scheme: GroupingScheme): Map<string, string> {
  const index = new Map<string, string>();
  for (const group of scheme.groups) {
    const keys = [group.name, ...group.aliases];
    for (const raw of keys) {
      const key = normalizeAlias(raw);
      if (!key) {
        continue;
      }
      if (!index.has(key)) {
        index.set(key, group.id);
      }
    }
  }
  return index;
}

/** Resolve a final ordered list of group ids for rendering, given an optional override. */
function resolveGroupOrder(scheme: GroupingScheme, override?: readonly string[]): ItemGroup[] {
  if (!override || override.length === 0) {
    return scheme.groups;
  }
  const byId = new Map<string, ItemGroup>();
  for (const g of scheme.groups) {
    byId.set(g.id, g);
  }
  const seen = new Set<string>();
  const ordered: ItemGroup[] = [];
  for (const id of override) {
    const group = byId.get(id);
    if (group && !seen.has(id)) {
      ordered.push(group);
      seen.add(id);
    }
  }
  for (const g of scheme.groups) {
    if (!seen.has(g.id)) {
      ordered.push(g);
    }
  }
  return ordered;
}

/**
 * Classify items by matching text against the scheme's group aliases.
 * Section display order is controlled by `groupOrder` when provided,
 * falling back to the scheme's canonical order.
 */
export function matchItemsToGroups(
  items: readonly TodoItem[],
  scheme: GroupingScheme,
  groupOrder?: readonly string[],
): MatchResult {
  const aliasIndex = buildAliasIndex(scheme);
  const orderedGroups = resolveGroupOrder(scheme, groupOrder);

  const buckets = new Map<string, TodoItem[]>();
  for (const g of orderedGroups) {
    buckets.set(g.id, []);
  }
  const other: TodoItem[] = [];

  for (const item of items) {
    const key = normalizeAlias(item.text);
    const groupId = aliasIndex.get(key);
    if (groupId && buckets.has(groupId)) {
      buckets.get(groupId)!.push(item);
    } else {
      other.push(item);
    }
  }

  const sections: GroupSection[] = orderedGroups.map((group) => ({
    group,
    items: buckets.get(group.id) ?? [],
  }));

  return { sections, other };
}
