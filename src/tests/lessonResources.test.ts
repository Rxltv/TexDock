import { describe, it, expect, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
}));

import {
  filterByPageId,
  excludeByStatus,
  sortByOrder,
  preparePageResources,
  filterByStatusForEnv,
} from '../lib/content/lessonResources';

interface TestResource {
  id: string;
  pageId: string;
  order: number;
  title: string;
  status: string;
}

function makeResource(overrides: Partial<TestResource> = {}): TestResource {
  return {
    id: '00-00-00',
    pageId: '00-00',
    order: 1,
    title: 'default',
    status: 'published',
    ...overrides,
  };
}

describe('lessonResources', () => {
  describe('filterByPageId', () => {
    it('filters items matching the given pageId', () => {
      const items = [
        makeResource({ id: 'a', pageId: '01-01-p01' }),
        makeResource({ id: 'b', pageId: '02-01-p01' }),
        makeResource({ id: 'c', pageId: '01-01-p01' }),
      ];
      const result = filterByPageId(items, '01-01-p01');
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['a', 'c']);
    });

    it('returns empty array when no items match', () => {
      const items = [makeResource({ pageId: '01-01-p01' })];
      const result = filterByPageId(items, '99-99-p99');
      expect(result).toEqual([]);
    });
  });

  describe('excludeByStatus', () => {
    it('excludes items with the given status', () => {
      const items = [
        makeResource({ id: 'a', status: 'published' }),
        makeResource({ id: 'b', status: 'draft' }),
        makeResource({ id: 'c', status: 'archived' }),
      ];
      const result = excludeByStatus(items, 'archived');
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['a', 'b']);
    });

    it('excludes items without status (fail-closed)', () => {
      const items = [
        makeResource({ id: 'a', status: 'published' }),
        { id: 'b', pageId: '00-00', order: 1, title: 'no status' } as TestResource,
      ];
      const result = excludeByStatus(items, 'draft');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('excludes multiple statuses at once', () => {
      const items = [
        makeResource({ id: 'a', status: 'published' }),
        makeResource({ id: 'b', status: 'draft' }),
        makeResource({ id: 'c', status: 'archived' }),
      ];
      const result = excludeByStatus(items, 'draft', 'archived');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('returns all items when nothing matches the excluded statuses', () => {
      const items = [
        makeResource({ id: 'a', status: 'published' }),
        makeResource({ id: 'b', status: 'published' }),
      ];
      const result = excludeByStatus(items, 'archived');
      expect(result).toHaveLength(2);
    });
  });

  describe('sortByOrder', () => {
    it('sorts items by order ascending', () => {
      const items = [
        makeResource({ id: 'c', order: 3 }),
        makeResource({ id: 'a', order: 1 }),
        makeResource({ id: 'b', order: 2 }),
      ];
      const result = sortByOrder(items);
      expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('does not mutate the original array', () => {
      const items = [
        makeResource({ id: 'b', order: 2 }),
        makeResource({ id: 'a', order: 1 }),
      ];
      const result = sortByOrder(items);
      expect(result.map((r) => r.id)).toEqual(['a', 'b']);
      expect(items.map((r) => r.id)).toEqual(['b', 'a']);
    });
  });

  describe('preparePageResources', () => {
    const sampleData: TestResource[] = [
      { id: 'ex-01', pageId: '01-01-p01', order: 2, title: 'Second', status: 'published' },
      { id: 'ex-02', pageId: '01-01-p01', order: 1, title: 'First', status: 'published' },
      { id: 'ex-03', pageId: '01-01-p01', order: 3, title: 'Draft', status: 'draft' },
      { id: 'ex-04', pageId: '01-01-p01', order: 4, title: 'Archived', status: 'archived' },
      { id: 'ex-05', pageId: '02-01-p01', order: 1, title: 'Other page', status: 'published' },
    ];

    it('filters by pageId and returns published items sorted by order', () => {
      const result = preparePageResources(sampleData, '01-01-p01');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ex-02');
      expect(result[1].id).toBe('ex-01');
      expect(result.every((r) => r.status === 'published')).toBe(true);
    });

    it('excludes archived items', () => {
      const result = preparePageResources(sampleData, '01-01-p01');
      expect(result.find((r) => r.id === 'ex-04')).toBeUndefined();
    });

    it('excludes draft items by default', () => {
      const result = preparePageResources(sampleData, '01-01-p01');
      expect(result.find((r) => r.id === 'ex-03')).toBeUndefined();
    });

    it('includes draft items when includeDrafts is true', () => {
      const result = preparePageResources(sampleData, '01-01-p01', { includeDrafts: true });
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.id)).toEqual(['ex-02', 'ex-01', 'ex-03']);
    });

    it('still excludes archived items even when includeDrafts is true', () => {
      const result = preparePageResources(sampleData, '01-01-p01', { includeDrafts: true });
      expect(result.find((r) => r.id === 'ex-04')).toBeUndefined();
    });

    it('returns ascending order', () => {
      const result = preparePageResources(sampleData, '01-01-p01');
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });

    it('returns empty array for page with no resources', () => {
      const result = preparePageResources(sampleData, '99-99-p99');
      expect(result).toEqual([]);
    });

    it('returns empty array when all items for a page are archived', () => {
      const data = [
        makeResource({ id: 'a', pageId: '01-01-p01', status: 'archived' }),
        makeResource({ id: 'b', pageId: '01-01-p01', status: 'archived' }),
      ];
      const result = preparePageResources(data, '01-01-p01');
      expect(result).toEqual([]);
    });

    it('returns empty array when all items for a page are draft and includeDrafts is false', () => {
      const data = [
        makeResource({ id: 'a', pageId: '01-01-p01', status: 'draft' }),
      ];
      const result = preparePageResources(data, '01-01-p01');
      expect(result).toEqual([]);
    });
  });

  describe('filterByStatusForEnv', () => {
    interface StatusItem {
      id: string;
      status?: string;
    }

    const items: StatusItem[] = [
      { id: 'pub', status: 'published' },
      { id: 'dft', status: 'draft' },
      { id: 'arc', status: 'archived' },
      { id: 'undef' },
      { id: 'unknown', status: 'unknown-value' },
    ];

    it('returns published and draft in dev, excluding everything else', () => {
      const result = filterByStatusForEnv(items, true);
      expect(result.map((r) => r.id)).toEqual(['pub', 'dft']);
    });

    it('returns only published in production', () => {
      const result = filterByStatusForEnv(items, false);
      expect(result.map((r) => r.id)).toEqual(['pub']);
    });

    it('always excludes archived regardless of environment', () => {
      const devResult = filterByStatusForEnv(items, true);
      const prodResult = filterByStatusForEnv(items, false);
      expect(devResult.find((r) => r.id === 'arc')).toBeUndefined();
      expect(prodResult.find((r) => r.id === 'arc')).toBeUndefined();
    });

    it('always excludes items without status (fail-closed)', () => {
      const devResult = filterByStatusForEnv(items, true);
      const prodResult = filterByStatusForEnv(items, false);
      expect(devResult.find((r) => r.id === 'undef')).toBeUndefined();
      expect(prodResult.find((r) => r.id === 'undef')).toBeUndefined();
    });

    it('always excludes items with unknown status (fail-closed)', () => {
      const devResult = filterByStatusForEnv(items, true);
      const prodResult = filterByStatusForEnv(items, false);
      expect(devResult.find((r) => r.id === 'unknown')).toBeUndefined();
      expect(prodResult.find((r) => r.id === 'unknown')).toBeUndefined();
    });

    it('handles empty array', () => {
      expect(filterByStatusForEnv([], true)).toEqual([]);
      expect(filterByStatusForEnv([], false)).toEqual([]);
    });
  });

  describe('data type coherence', () => {
    it('uses consistent shape for ExampleResource', () => {
      const resources: Array<{
        id: string;
        pageId: string;
        order: number;
        status: string;
      }> = [
        { id: 'ex-01', pageId: '01-01-p01', order: 1, status: 'published' },
      ];
      expect(resources[0].id).toBeTypeOf('string');
      expect(resources[0].pageId).toBeTypeOf('string');
      expect(resources[0].order).toBeTypeOf('number');
      expect(resources[0].status).toBeTypeOf('string');
    });
  });
});
