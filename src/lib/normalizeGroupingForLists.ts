import type { GroupingScheme, ListTemplate, TemplateItem, TodoItem, TodoList } from '../types';

const groupIdSet = (scheme: GroupingScheme): ReadonlySet<string> =>
  new Set(scheme.groups.map((g) => g.id));

export function snapTodoItemGroupId(item: TodoItem, scheme: GroupingScheme): TodoItem {
  const ids = groupIdSet(scheme);
  if (item.groupId !== undefined && ids.has(item.groupId)) {
    return item;
  }
  return { ...item, groupId: scheme.defaultGroupId };
}

export function normalizeTodoListForSchemes(list: TodoList, schemes: readonly GroupingScheme[]): TodoList {
  if (!list.groupingSchemeId) {
    return list;
  }
  const scheme = schemes.find((s) => s.id === list.groupingSchemeId);
  if (!scheme) {
    return list;
  }
  let changed = false;
  const items = list.items.map((item) => {
    const next = snapTodoItemGroupId(item, scheme);
    if (next !== item) {
      changed = true;
    }
    return next;
  });
  if (!changed) {
    return list;
  }
  return { ...list, items };
}

export function normalizeTodoLists(lists: readonly TodoList[], schemes: readonly GroupingScheme[]): TodoList[] {
  return lists.map((list) => normalizeTodoListForSchemes(list, schemes));
}

export function snapTemplateItemGroupId(item: TemplateItem, scheme: GroupingScheme): TemplateItem {
  const ids = groupIdSet(scheme);
  if (item.groupId !== undefined && ids.has(item.groupId)) {
    return item;
  }
  return { ...item, groupId: scheme.defaultGroupId };
}

export function normalizeListTemplateForSchemes(
  template: ListTemplate,
  schemes: readonly GroupingScheme[],
): ListTemplate {
  if (!template.groupingSchemeId) {
    return template;
  }
  const scheme = schemes.find((s) => s.id === template.groupingSchemeId);
  if (!scheme) {
    return template;
  }
  let changed = false;
  const items = template.items.map((item) => {
    const next = snapTemplateItemGroupId(item, scheme);
    if (next !== item) {
      changed = true;
    }
    return next;
  });
  if (!changed) {
    return template;
  }
  return { ...template, items };
}

export function normalizeListTemplates(
  templates: readonly ListTemplate[],
  schemes: readonly GroupingScheme[],
): ListTemplate[] {
  return templates.map((t) => normalizeListTemplateForSchemes(t, schemes));
}
