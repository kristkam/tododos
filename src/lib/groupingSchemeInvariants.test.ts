import { describe, expect, it } from 'vitest';
import { normalizeGroupAliases, validateGroupingSchemeDraft } from './groupingSchemeInvariants';

describe('validateGroupingSchemeDraft', () => {
  it('returns null for valid draft', () => {
    expect(
      validateGroupingSchemeDraft({
        name: 'Dinners',
        groups: [
          { id: 'a', name: 'Pasta', aliases: [] },
          { id: 'b', name: 'Other', aliases: ['misc'] },
        ],
      }),
    ).toBeNull();
  });

  it('rejects empty name', () => {
    expect(
      validateGroupingSchemeDraft({
        name: '   ',
        groups: [{ id: 'a', name: 'x', aliases: [] }],
      }),
    ).toBe('empty-name');
  });

  it('rejects no groups', () => {
    expect(
      validateGroupingSchemeDraft({
        name: 'x',
        groups: [],
      }),
    ).toBe('no-groups');
  });

  it('rejects duplicate group names (case-insensitive)', () => {
    expect(
      validateGroupingSchemeDraft({
        name: 'x',
        groups: [
          { id: 'a', name: 'Fruit', aliases: [] },
          { id: 'b', name: 'fruit', aliases: [] },
        ],
      }),
    ).toBe('duplicate-group-name');
  });

  it('rejects an alias that collides with a group name', () => {
    expect(
      validateGroupingSchemeDraft({
        name: 'x',
        groups: [
          { id: 'a', name: 'Fruit', aliases: [] },
          { id: 'b', name: 'Meat', aliases: ['fruit'] },
        ],
      }),
    ).toBe('duplicate-alias');
  });
});

describe('normalizeGroupAliases', () => {
  it('trims, lowercases, de-duplicates, and excludes the name itself', () => {
    const normalized = normalizeGroupAliases({
      id: 'g',
      name: 'Fruit',
      aliases: [' Apple ', 'apple', 'FRUIT', '  ', 'berry'],
    });
    expect(normalized.aliases).toEqual(['apple', 'berry']);
  });
});
