import type { ListTemplate, TodoList } from '../types';

export type GroupReferenceCounts = {
  listItemCount: number;
  templateItemCount: number;
};

export function countGroupReferences(
  schemeId: string,
  groupId: string,
  lists: readonly TodoList[],
  templates: readonly ListTemplate[],
): GroupReferenceCounts {
  let listItemCount = 0;
  for (const list of lists) {
    if (list.groupingSchemeId !== schemeId) {
      continue;
    }
    for (const item of list.items) {
      if (item.groupId === groupId) {
        listItemCount += 1;
      }
    }
  }
  let templateItemCount = 0;
  for (const template of templates) {
    if (template.groupingSchemeId !== schemeId) {
      continue;
    }
    for (const item of template.items) {
      if (item.groupId === groupId) {
        templateItemCount += 1;
      }
    }
  }
  return { listItemCount, templateItemCount };
}
