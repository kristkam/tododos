import type { GroupingScheme, ListTemplate, TemplateItem, TodoItem } from '../types';

/** Client-generated id for new rows (todo items from templates, template editor rows). */
export function newClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Turn persisted template rows into new todo items for a fresh list (new ids, not completed). */
export function materializeTemplateItems(template: ListTemplate, listScheme?: GroupingScheme): TodoItem[] {
  const now = new Date();
  return template.items.map((item) => {
    const base: TodoItem = {
      id: newClientId(),
      text: item.text,
      completed: false,
      createdAt: now,
      order: item.order,
    };
    if (!listScheme) {
      return base;
    }
    const ids = new Set(listScheme.groups.map((g) => g.id));
    const groupId =
      item.groupId !== undefined && ids.has(item.groupId) ? item.groupId : listScheme.defaultGroupId;
    return { ...base, groupId };
  });
}

/** Copy list items into template shape (no completion or createdAt). */
export function todoItemsToTemplateItems(items: TodoItem[]): TemplateItem[] {
  return items.map((item) => {
    const row: TemplateItem = {
      id: item.id,
      text: item.text,
      order: item.order,
    };
    if (item.groupId !== undefined) {
      row.groupId = item.groupId;
    }
    return row;
  });
}
