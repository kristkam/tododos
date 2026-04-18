import { describe, expect, it } from 'vitest';
import type { GroupingScheme, TodoItem } from '../types';
import { groupItems, resolveItemGroupId } from './groupItems';

const scheme = (): GroupingScheme => ({
  id: 's1',
  name: 'Test',
  groups: [
    { id: 'g-a', name: 'A' },
    { id: 'g-b', name: 'B' },
  ],
  defaultGroupId: 'g-a',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const item = (overrides: Partial<TodoItem> & Pick<TodoItem, 'id' | 'text'>): TodoItem => ({
  id: overrides.id,
  text: overrides.text,
  completed: false,
  createdAt: new Date(0),
  order: 0,
  ...overrides,
});

describe('resolveItemGroupId', () => {
  it('returns item groupId when valid', () => {
    const s = scheme();
    expect(resolveItemGroupId(item({ id: '1', text: 'x', groupId: 'g-b' }), s)).toBe('g-b');
  });

  it('snaps unknown groupId to default', () => {
    const s = scheme();
    expect(resolveItemGroupId(item({ id: '1', text: 'x', groupId: 'gone' }), s)).toBe('g-a');
  });

  it('snaps missing groupId to default', () => {
    const s = scheme();
    expect(resolveItemGroupId(item({ id: '1', text: 'x' }), s)).toBe('g-a');
  });
});

describe('groupItems', () => {
  it('returns empty array when no items match any group bucket with items', () => {
    const s = scheme();
    expect(groupItems([], s)).toEqual([]);
  });

  it('orders sections by scheme group order', () => {
    const s = scheme();
    const items: TodoItem[] = [
      item({ id: '1', text: 'b1', groupId: 'g-b' }),
      item({ id: '2', text: 'a1', groupId: 'g-a' }),
    ];
    const sections = groupItems(items, s);
    expect(sections.map((x) => x.group.id)).toEqual(['g-a', 'g-b']);
    expect(sections[0].items.map((i) => i.id)).toEqual(['2']);
    expect(sections[1].items.map((i) => i.id)).toEqual(['1']);
  });

  it('omits empty sections', () => {
    const s = scheme();
    const items: TodoItem[] = [item({ id: '1', text: 'only-a', groupId: 'g-a' })];
    const sections = groupItems(items, s);
    expect(sections).toHaveLength(1);
    expect(sections[0].group.id).toBe('g-a');
  });

  it('puts invalid groupId items into default group section', () => {
    const s = scheme();
    const items: TodoItem[] = [item({ id: '1', text: 'bad', groupId: 'nope' })];
    const sections = groupItems(items, s);
    expect(sections).toHaveLength(1);
    expect(sections[0].group.id).toBe('g-a');
  });
});
