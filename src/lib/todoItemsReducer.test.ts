import { describe, expect, it } from 'vitest';
import { applyTodoItemsAction } from './todoItemsReducer';
import type { TodoItem } from '../types';

const item = (id: string): TodoItem => ({
  id,
  text: id,
  completed: false,
  createdAt: new Date(),
});

describe('applyTodoItemsAction', () => {
  it('adds an item', () => {
    const next = applyTodoItemsAction([item('a')], { type: 'add', item: item('b') });
    expect(next.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('updates an item', () => {
    const next = applyTodoItemsAction([item('a')], {
      type: 'update',
      item: { ...item('a'), text: 'x', completed: true },
    });
    expect(next[0].text).toBe('x');
    expect(next[0].completed).toBe(true);
  });

  it('deletes an item', () => {
    const next = applyTodoItemsAction([item('a'), item('b')], { type: 'delete', itemId: 'a' });
    expect(next.map((i) => i.id)).toEqual(['b']);
  });

  it('replaces order on reorder', () => {
    const next = applyTodoItemsAction([item('a'), item('b')], {
      type: 'reorder',
      items: [{ ...item('b'), order: 0 }, { ...item('a'), order: 1 }],
    });
    expect(next.map((i) => i.id)).toEqual(['b', 'a']);
  });
});
