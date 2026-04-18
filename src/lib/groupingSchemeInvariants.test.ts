import { describe, expect, it } from 'vitest';
import { validateGroupingSchemeDraft } from './groupingSchemeInvariants';

describe('validateGroupingSchemeDraft', () => {
  it('returns null for valid draft', () => {
    expect(
      validateGroupingSchemeDraft({
        name: 'Dinners',
        groups: [
          { id: 'a', name: 'Pasta' },
          { id: 'b', name: 'Other' },
        ],
        defaultGroupId: 'b',
      }),
    ).toBeNull();
  });

  it('rejects empty name', () => {
    expect(
      validateGroupingSchemeDraft({
        name: '   ',
        groups: [{ id: 'a', name: 'x' }],
        defaultGroupId: 'a',
      }),
    ).toBe('empty-name');
  });

  it('rejects no groups', () => {
    expect(
      validateGroupingSchemeDraft({
        name: 'x',
        groups: [],
        defaultGroupId: 'a',
      }),
    ).toBe('no-groups');
  });

  it('rejects invalid default', () => {
    expect(
      validateGroupingSchemeDraft({
        name: 'x',
        groups: [{ id: 'a', name: 'y' }],
        defaultGroupId: 'missing',
      }),
    ).toBe('invalid-default-group');
  });
});
