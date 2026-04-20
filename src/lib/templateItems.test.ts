import { describe, expect, it, vi } from 'vitest';
import { materializeTemplateItems, todoItemsToTemplateItems } from './templateItems';
import type { ListTemplate, TodoItem } from '../types';

describe('materializeTemplateItems', () => {
  it('assigns unique ids, sets completed false, preserves text and order', () => {
    const template: ListTemplate = {
      id: 'tpl-1',
      name: 'Packing',
      items: [
        { id: 'old-a', text: 'Socks', order: 0 },
        { id: 'old-b', text: 'Toothbrush', order: 1 },
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    let call = 0;
    const spy = vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
      call += 1;
      return `uuid-${call}`;
    });

    const out = materializeTemplateItems(template);
    expect(out).toHaveLength(2);
    expect(out[0].text).toBe('Socks');
    expect(out[0].completed).toBe(false);
    expect(out[0].order).toBe(0);
    expect(out[0].id).toBe('uuid-1');
    expect(out[1].id).toBe('uuid-2');
    expect(out[1].text).toBe('Toothbrush');
    expect(out[1].order).toBe(1);
    expect(out[0].createdAt).toEqual(out[1].createdAt);

    spy.mockRestore();
  });
});

describe('todoItemsToTemplateItems', () => {
  it('maps to template items dropping completed, createdAt, and any legacy fields', () => {
    const items: TodoItem[] = [
      {
        id: 'i1',
        text: 'Buy milk',
        completed: true,
        createdAt: new Date('2020-01-01'),
        order: 2,
      },
    ];
    const out = todoItemsToTemplateItems(items);
    expect(out).toEqual([{ id: 'i1', text: 'Buy milk', order: 2 }]);
    expect('completed' in out[0]).toBe(false);
    expect('createdAt' in out[0]).toBe(false);
  });
});
