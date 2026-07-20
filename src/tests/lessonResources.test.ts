import { describe, it, expect, vi } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
}));

import {
  filterByLessonId,
  excludeByStatus,
  sortByOrder,
  prepareLessonResources,
  filterByStatusForEnv,
  assertLessonSectionExists,
  buildLessonPath,
} from '../lib/content/lessonResources';

interface TestResource {
  id: string;
  lessonId: string;
  order: number;
  title: string;
  status: string;
}

function makeExample(overrides: Partial<TestResource> = {}): TestResource {
  return {
    id: '00-00-00',
    lessonId: '00-00',
    order: 1,
    title: 'default',
    status: 'published',
    ...overrides,
  };
}

describe('lessonResources', () => {
  describe('filterByLessonId', () => {
    it('filters items matching the given lessonId', () => {
      const items = [
        makeExample({ id: 'a', lessonId: '01-01' }),
        makeExample({ id: 'b', lessonId: '02-01' }),
        makeExample({ id: 'c', lessonId: '01-01' }),
      ];
      const result = filterByLessonId(items, '01-01');
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['a', 'c']);
    });

    it('returns empty array when no items match', () => {
      const items = [makeExample({ lessonId: '01-01' })];
      const result = filterByLessonId(items, '99-99');
      expect(result).toEqual([]);
    });
  });

  describe('excludeByStatus', () => {
    it('excludes items with the given status', () => {
      const items = [
        makeExample({ id: 'a', status: 'published' }),
        makeExample({ id: 'b', status: 'draft' }),
        makeExample({ id: 'c', status: 'archived' }),
      ];
      const result = excludeByStatus(items, 'archived');
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['a', 'b']);
    });

    it('excludes multiple statuses at once', () => {
      const items = [
        makeExample({ id: 'a', status: 'published' }),
        makeExample({ id: 'b', status: 'draft' }),
        makeExample({ id: 'c', status: 'archived' }),
      ];
      const result = excludeByStatus(items, 'draft', 'archived');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('returns all items when nothing matches the excluded statuses', () => {
      const items = [
        makeExample({ id: 'a', status: 'published' }),
        makeExample({ id: 'b', status: 'published' }),
      ];
      const result = excludeByStatus(items, 'archived');
      expect(result).toHaveLength(2);
    });
  });

  describe('sortByOrder', () => {
    it('sorts items by order ascending', () => {
      const items = [
        makeExample({ id: 'c', order: 3 }),
        makeExample({ id: 'a', order: 1 }),
        makeExample({ id: 'b', order: 2 }),
      ];
      const result = sortByOrder(items);
      expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('does not mutate the original array', () => {
      const items = [
        makeExample({ id: 'b', order: 2 }),
        makeExample({ id: 'a', order: 1 }),
      ];
      const result = sortByOrder(items);
      expect(result.map((r) => r.id)).toEqual(['a', 'b']);
      expect(items.map((r) => r.id)).toEqual(['b', 'a']);
    });
  });

  describe('prepareLessonResources', () => {
    const sampleData: TestResource[] = [
      { id: 'ex-01', lessonId: '01-01', order: 2, title: 'Second', status: 'published' },
      { id: 'ex-02', lessonId: '01-01', order: 1, title: 'First', status: 'published' },
      { id: 'ex-03', lessonId: '01-01', order: 3, title: 'Draft', status: 'draft' },
      { id: 'ex-04', lessonId: '01-01', order: 4, title: 'Archived', status: 'archived' },
      { id: 'ex-05', lessonId: '02-01', order: 1, title: 'Other lesson', status: 'published' },
    ];

    it('filters by lessonId and returns published items sorted by order', () => {
      const result = prepareLessonResources(sampleData, '01-01');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ex-02');
      expect(result[1].id).toBe('ex-01');
      expect(result.every((r) => r.status === 'published')).toBe(true);
    });

    it('excludes archived items', () => {
      const result = prepareLessonResources(sampleData, '01-01');
      expect(result.find((r) => r.id === 'ex-04')).toBeUndefined();
    });

    it('excludes draft items by default', () => {
      const result = prepareLessonResources(sampleData, '01-01');
      expect(result.find((r) => r.id === 'ex-03')).toBeUndefined();
    });

    it('includes draft items when includeDrafts is true', () => {
      const result = prepareLessonResources(sampleData, '01-01', { includeDrafts: true });
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.id)).toEqual(['ex-02', 'ex-01', 'ex-03']);
    });

    it('still excludes archived items even when includeDrafts is true', () => {
      const result = prepareLessonResources(sampleData, '01-01', { includeDrafts: true });
      expect(result.find((r) => r.id === 'ex-04')).toBeUndefined();
    });

    it('returns ascending order', () => {
      const result = prepareLessonResources(sampleData, '01-01');
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });

    it('returns empty array for lesson with no resources', () => {
      const result = prepareLessonResources(sampleData, '99-99');
      expect(result).toEqual([]);
    });

    it('returns empty array when all items for a lesson are archived', () => {
      const data = [
        makeExample({ id: 'a', lessonId: '01-01', status: 'archived' }),
        makeExample({ id: 'b', lessonId: '01-01', status: 'archived' }),
      ];
      const result = prepareLessonResources(data, '01-01');
      expect(result).toEqual([]);
    });

    it('returns empty array when all items for a lesson are draft and includeDrafts is false', () => {
      const data = [
        makeExample({ id: 'a', lessonId: '01-01', status: 'draft' }),
      ];
      const result = prepareLessonResources(data, '01-01');
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

  describe('assertLessonSectionExists', () => {
    const knownSections = ['seccion-01', 'seccion-02', 'seccion-03'];

    it('does not throw for a lesson with a valid section', () => {
      expect(() =>
        assertLessonSectionExists('01-01', 'seccion-01', knownSections),
      ).not.toThrow();
    });

    it('throws for a lesson referencing an inexistent section', () => {
      expect(() =>
        assertLessonSectionExists('99-01', 'seccion-99', knownSections),
      ).toThrow();
    });

    it('throws with a message containing the lesson ID', () => {
      expect(() =>
        assertLessonSectionExists('01-01', 'seccion-99', knownSections),
      ).toThrow(/01-01/);
    });

    it('throws with a message containing the missing section ID', () => {
      expect(() =>
        assertLessonSectionExists('01-01', 'seccion-99', knownSections),
      ).toThrow(/seccion-99/);
    });

    it('does not throw when the referenced section exists, regardless of naming expectations', () => {
      expect(() =>
        assertLessonSectionExists('01-01', 'seccion-02', knownSections),
      ).not.toThrow();
    });
  });

  describe('buildLessonPath', () => {
    it('builds a hierarchical path from section and lesson IDs', () => {
      expect(buildLessonPath('seccion-01', '01-01')).toBe('/aprender/seccion-01/01-01/');
    });

    it('builds path for another section-lesson pair', () => {
      expect(buildLessonPath('seccion-02', '02-01')).toBe('/aprender/seccion-02/02-01/');
    });

    it('includes trailing slash', () => {
      const path = buildLessonPath('seccion-15', '15-01');
      expect(path).toMatch(/\/$/);
    });

    it('does not associate a lesson with the wrong section', () => {
      const lesson01path = buildLessonPath('seccion-01', '02-01');
      const lesson02path = buildLessonPath('seccion-02', '02-01');
      expect(lesson01path).not.toBe(lesson02path);
      expect(lesson01path).toContain('seccion-01');
      expect(lesson02path).toContain('seccion-02');
    });
  });

  describe('data type coherence', () => {
    it('uses consistent shape for ExampleResource', () => {
      const resources: Array<{
        id: string;
        lessonId: string;
        order: number;
        status: string;
      }> = [
        { id: '01-01-01', lessonId: '01-01', order: 1, status: 'published' },
      ];
      expect(resources[0].id).toBeTypeOf('string');
      expect(resources[0].lessonId).toBeTypeOf('string');
      expect(resources[0].order).toBeTypeOf('number');
      expect(resources[0].status).toBeTypeOf('string');
    });
  });
});
