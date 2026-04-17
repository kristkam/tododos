import type { SortOption, TodoItem } from '../types';

/** Pure sort for display — mutates a shallow copy of the input array. */
export function sortItems(items: readonly TodoItem[], sortBy: SortOption): TodoItem[] {
  const itemsArray = [...items];

  switch (sortBy) {
    case 'completed-top':
      return itemsArray.sort((a, b) => {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    case 'completed-bottom':
      return itemsArray.sort((a, b) => {
        if (!a.completed && b.completed) return -1;
        if (a.completed && !b.completed) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    case 'normal':
      return itemsArray.sort((a, b) => {
        const orderA = a.order ?? new Date(a.createdAt).getTime();
        const orderB = b.order ?? new Date(b.createdAt).getTime();
        return orderA - orderB;
      });
  }
}
