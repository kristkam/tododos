import { describe, expect, it } from 'vitest';
import { matchItemsToGroups, normalizeAlias } from './matchItemsToGroups';
import type { GroupingScheme, TodoItem } from '../types';

function item(id: string, text: string): TodoItem {
  return { id, text, completed: false, createdAt: new Date('2024-01-01') };
}

function scheme(): GroupingScheme {
  return {
    id: 'sch',
    name: 'Groceries',
    groups: [
      { id: 'veg', name: 'Vegetables', aliases: ['carrot', 'broccoli'] },
      { id: 'meat', name: 'Meat', aliases: ['beef', 'chicken'] },
      { id: 'misc', name: 'Misc', aliases: [] },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('normalizeAlias', () => {
  it('trims, lowercases, and collapses whitespace', () => {
    expect(normalizeAlias('  Green Beans  ')).toBe('green beans');
    expect(normalizeAlias('Green   Beans')).toBe('green beans');
    expect(normalizeAlias('')).toBe('');
  });
});

describe('matchItemsToGroups', () => {
  it('matches by group name (case-insensitive) and by alias', () => {
    const items = [item('1', 'vegetables'), item('2', 'Beef'), item('3', 'Broccoli')];
    const result = matchItemsToGroups(items, scheme());

    expect(result.sections.map((s) => s.group.id)).toEqual(['veg', 'meat', 'misc']);
    expect(result.sections[0].items.map((i) => i.id)).toEqual(['1', '3']);
    expect(result.sections[1].items.map((i) => i.id)).toEqual(['2']);
    expect(result.sections[2].items).toEqual([]);
    expect(result.other).toEqual([]);
  });

  it('places unmatched items into `other`, preserving their order', () => {
    const items = [item('1', 'Unicorn'), item('2', 'Carrot'), item('3', 'Random thing')];
    const result = matchItemsToGroups(items, scheme());

    expect(result.sections[0].items.map((i) => i.id)).toEqual(['2']);
    expect(result.other.map((i) => i.id)).toEqual(['1', '3']);
  });

  it('respects a groupOrder override for section display order', () => {
    const result = matchItemsToGroups([item('1', 'Beef')], scheme(), ['meat', 'veg', 'misc']);
    expect(result.sections.map((s) => s.group.id)).toEqual(['meat', 'veg', 'misc']);
  });

  it('appends scheme-known groups that are missing from the override to the end', () => {
    const result = matchItemsToGroups([], scheme(), ['meat']);
    expect(result.sections.map((s) => s.group.id)).toEqual(['meat', 'veg', 'misc']);
  });

  it('ignores unknown ids in the override and de-duplicates repeats', () => {
    const result = matchItemsToGroups([], scheme(), ['meat', 'ghost', 'meat', 'veg']);
    expect(result.sections.map((s) => s.group.id)).toEqual(['meat', 'veg', 'misc']);
  });

  it('normalizes item text (trim, case, whitespace) before matching', () => {
    const items = [item('1', '  CARROT '), item('2', 'green   BEANS')];
    const s: GroupingScheme = {
      ...scheme(),
      groups: [
        { id: 'veg', name: 'Vegetables', aliases: ['carrot', 'green beans'] },
      ],
    };
    const result = matchItemsToGroups(items, s);
    expect(result.sections[0].items.map((i) => i.id)).toEqual(['1', '2']);
    expect(result.other).toEqual([]);
  });

  it('first group to claim an alias wins when duplicates slip through', () => {
    const s: GroupingScheme = {
      ...scheme(),
      groups: [
        { id: 'a', name: 'A', aliases: ['shared'] },
        { id: 'b', name: 'B', aliases: ['shared'] },
      ],
    };
    const result = matchItemsToGroups([item('1', 'shared')], s);
    expect(result.sections.find((sec) => sec.group.id === 'a')?.items.map((i) => i.id)).toEqual(['1']);
    expect(result.sections.find((sec) => sec.group.id === 'b')?.items).toEqual([]);
  });

  it('preserves input item order within each section', () => {
    const items = [item('1', 'Carrot'), item('2', 'Broccoli'), item('3', 'Carrot')];
    const result = matchItemsToGroups(items, scheme());
    expect(result.sections[0].items.map((i) => i.id)).toEqual(['1', '2', '3']);
  });
});
