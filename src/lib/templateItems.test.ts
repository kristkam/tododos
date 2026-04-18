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

  it('assigns default group when a list scheme is provided', () => {
    const template: ListTemplate = {
      id: 'tpl-1',
      name: 'Shop',
      items: [{ id: 'old', text: 'Milk', order: 0 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const listScheme = {
      id: 'sch-1',
      name: 'Aisles',
      groups: [
        { id: 'dairy', name: 'Dairy' },
        { id: 'other', name: 'Other' },
      ],
      defaultGroupId: 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const out = materializeTemplateItems(template, listScheme);
    expect(out).toHaveLength(1);
    expect(out[0].groupId).toBe('other');
  });
});

describe('todoItemsToTemplateItems', () => {
  it('maps to template items without completed or createdAt in the result shape', () => {
    const items: TodoItem[] = [
      {
        id: 'i1',
        text: 'Buy milk',
        completed: true,
        createdAt: new Date('2020-01-01'),
        order: 2,
        groupId: 'g1',
      },
    ];
    const out = todoItemsToTemplateItems(items);
    expect(out).toEqual([{ id: 'i1', text: 'Buy milk', order: 2, groupId: 'g1' }]);
    expect('completed' in out[0]).toBe(false);
    expect('createdAt' in out[0]).toBe(false);
  });
});
