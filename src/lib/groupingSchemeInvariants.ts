import type { GroupingScheme, ItemGroup } from '../types';

export type GroupingSchemeValidationError =
  | 'empty-name'
  | 'no-groups'
  | 'invalid-default-group'
  | 'empty-group-name';

export function validateGroupingSchemeDraft(input: {
  name: string;
  groups: readonly ItemGroup[];
  defaultGroupId: string;
}): GroupingSchemeValidationError | null {
  if (input.name.trim().length === 0) {
    return 'empty-name';
  }
  if (input.groups.length === 0) {
    return 'no-groups';
  }
  const groupIds = new Set(input.groups.map((g) => g.id));
  if (!groupIds.has(input.defaultGroupId)) {
    return 'invalid-default-group';
  }
  for (const g of input.groups) {
    if (g.name.trim().length === 0) {
      return 'empty-group-name';
    }
  }
  return null;
}

export function isValidGroupingScheme(scheme: GroupingScheme): boolean {
  return validateGroupingSchemeDraft({
    name: scheme.name,
    groups: scheme.groups,
    defaultGroupId: scheme.defaultGroupId,
  }) === null;
}
