import { describe, expect, it } from 'vitest';
import { sortItems } from './sortItems';
import type { TodoItem } from '../types';

const mk = (id: string, created: string, order?: number, completed = false): TodoItem => ({
  id,
  text: id,
  completed,
  createdAt: new Date(created),
  order,
});

describe('sortItems', () => {
  it('orders by custom order in normal mode', () => {
    const a = mk('a', '2020-01-01', 10);
    const b = mk('b', '2020-01-02', 0);
    const out = sortItems([a, b], 'normal');
    expect(out.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('puts completed first in completed-top mode', () => {
    const open = mk('o', '2020-01-01', 0, false);
    const done = mk('d', '2020-01-02', 1, true);
    const out = sortItems([open, done], 'completed-top');
    expect(out.map((i) => i.id)).toEqual(['d', 'o']);
  });

  it('puts completed last in completed-bottom mode', () => {
    const open = mk('o', '2020-01-01', 0, false);
    const done = mk('d', '2020-01-02', 1, true);
    const out = sortItems([done, open], 'completed-bottom');
    expect(out.map((i) => i.id)).toEqual(['o', 'd']);
  });
});
