import type { ListTemplate, TemplateItem, TodoItem } from '../types';

/** Client-generated id for new rows (todo items from templates, template editor rows). */
export function newClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Turn persisted template rows into new todo items for a fresh list (new ids, not completed). */
export function materializeTemplateItems(template: ListTemplate): TodoItem[] {
  const now = new Date();
  return template.items.map((item) => ({
    id: newClientId(),
    text: item.text,
    completed: false,
    createdAt: now,
    order: item.order,
  }));
}

/** Copy list items into template shape (no completion or createdAt). */
export function todoItemsToTemplateItems(items: TodoItem[]): TemplateItem[] {
  return items.map((item) => ({
    id: item.id,
    text: item.text,
    order: item.order,
  }));
}
