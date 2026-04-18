import { describe, expect, it } from 'vitest';
import type { GroupingScheme, ItemGroup, TodoItem } from '../types';
import { groupItems } from './groupItems';
import { applyGroupedDragReorder } from './applyGroupedDragReorder';

const group = (id: string, name: string): ItemGroup => ({ id, name });

const scheme = (): GroupingScheme => ({
  id: 's1',
  name: 'Test',
  groups: [group('g-a', 'A'), group('g-b', 'B')],
  defaultGroupId: 'g-a',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const todo = (overrides: Partial<TodoItem> & Pick<TodoItem, 'id' | 'text' | 'groupId'>): TodoItem => ({
  id: overrides.id,
  text: overrides.text,
  completed: false,
  createdAt: new Date(0),
  order: 0,
  groupId: overrides.groupId,
  ...overrides,
});

describe('applyGroupedDragReorder', () => {
  it('returns null when active and over are the same id', () => {
    const s = scheme();
    const sections = groupItems([todo({ id: '1', text: 'a', groupId: 'g-a' })], s);
    expect(applyGroupedDragReorder(sections, '1', '1')).toBeNull();
  });

  it('reorders within a section and reassigns contiguous order', () => {
    const s = scheme();
    const items = [
      todo({ id: '1', text: 'first', groupId: 'g-a' }),
      todo({ id: '2', text: 'second', groupId: 'g-a' }),
    ];
    const sections = groupItems(items, s);
    const next = applyGroupedDragReorder(sections, '2', '1');
    expect(next).not.toBeNull();
    expect(next!.map((i) => i.id)).toEqual(['2', '1']);
    expect(next!.map((i) => i.order)).toEqual([0, 1]);
    expect(next!.every((i) => i.groupId === 'g-a')).toBe(true);
  });

  it('moves an item to another section before the over item and sets groupId', () => {
    const s = scheme();
    const items = [
      todo({ id: 'a1', text: 'a-only', groupId: 'g-a' }),
      todo({ id: 'b1', text: 'b1', groupId: 'g-b' }),
      todo({ id: 'b2', text: 'b2', groupId: 'g-b' }),
    ];
    const sections = groupItems(items, s);
    const next = applyGroupedDragReorder(sections, 'a1', 'b2');
    expect(next).not.toBeNull();
    expect(next!.map((i) => i.id)).toEqual(['b1', 'a1', 'b2']);
    expect(next!.find((i) => i.id === 'a1')!.groupId).toBe('g-b');
    expect(next!.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it('moves from later section to earlier section', () => {
    const s = scheme();
    const items = [
      todo({ id: 'a1', text: 'a1', groupId: 'g-a' }),
      todo({ id: 'b1', text: 'b1', groupId: 'g-b' }),
    ];
    const sections = groupItems(items, s);
    const next = applyGroupedDragReorder(sections, 'b1', 'a1');
    expect(next).not.toBeNull();
    expect(next!.map((i) => i.id)).toEqual(['b1', 'a1']);
    expect(next!.find((i) => i.id === 'b1')!.groupId).toBe('g-a');
  });
});
