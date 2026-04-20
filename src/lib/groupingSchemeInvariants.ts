import type { GroupingScheme, ItemGroup } from '../types';
import { normalizeAlias } from './matchItemsToGroups';

export type GroupingSchemeValidationError =
  | 'empty-name'
  | 'no-groups'
  | 'empty-group-name'
  | 'duplicate-group-name'
  | 'empty-alias'
  | 'duplicate-alias';

export type GroupingSchemeDraft = {
  name: string;
  groups: readonly ItemGroup[];
};

export function validateGroupingSchemeDraft(
  input: GroupingSchemeDraft,
): GroupingSchemeValidationError | null {
  if (input.name.trim().length === 0) {
    return 'empty-name';
  }
  if (input.groups.length === 0) {
    return 'no-groups';
  }

  const seenGroupNames = new Set<string>();
  const seenAliases = new Set<string>();

  for (const group of input.groups) {
    const normalizedName = normalizeAlias(group.name);
    if (normalizedName.length === 0) {
      return 'empty-group-name';
    }
    if (seenGroupNames.has(normalizedName)) {
      return 'duplicate-group-name';
    }
    seenGroupNames.add(normalizedName);

    if (seenAliases.has(normalizedName)) {
      return 'duplicate-alias';
    }
    seenAliases.add(normalizedName);

    for (const alias of group.aliases) {
      const normalized = normalizeAlias(alias);
      if (normalized.length === 0) {
        return 'empty-alias';
      }
      if (seenAliases.has(normalized)) {
        return 'duplicate-alias';
      }
      seenAliases.add(normalized);
    }
  }

  return null;
}

export function isValidGroupingScheme(scheme: GroupingScheme): boolean {
  return validateGroupingSchemeDraft({ name: scheme.name, groups: scheme.groups }) === null;
}

/** Normalize aliases on a group: trim/lowercase/collapse, drop empty, drop dupes, drop the name itself. */
export function normalizeGroupAliases(group: ItemGroup): ItemGroup {
  const nameKey = normalizeAlias(group.name);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of group.aliases) {
    const normalized = normalizeAlias(raw);
    if (!normalized || normalized === nameKey || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
  }
  return { id: group.id, name: group.name.trim(), aliases: out };
}
