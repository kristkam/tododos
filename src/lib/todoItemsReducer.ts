import type { TodoItem } from '../types';

export type TodoItemsOptimisticAction =
  | { type: 'add'; item: TodoItem }
  | { type: 'update'; item: TodoItem }
  | { type: 'delete'; itemId: string }
  | { type: 'reorder'; items: TodoItem[] };

export function applyTodoItemsAction(
  items: readonly TodoItem[],
  action: TodoItemsOptimisticAction
): TodoItem[] {
  switch (action.type) {
    case 'add':
      return [...items, action.item];
    case 'update':
      return items.map((item) => (item.id === action.item.id ? action.item : item));
    case 'delete':
      return items.filter((item) => item.id !== action.itemId);
    case 'reorder':
      return action.items;
  }
}
