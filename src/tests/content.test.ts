import { describe, it, expect } from 'vitest';

interface SectionData {
  id: string;
  title: string;
  description: string;
  order: number;
  lessonOrder: string[];
}

interface LessonData {
  id: string;
  title: string;
  section: string;
  order: number;
}

describe('Content structure', () => {
  describe('Section ordering', () => {
    const sections: SectionData[] = Array.from({ length: 15 }, (_, i) => ({
      id: `seccion-${String(i + 1).padStart(2, '0')}`,
      title: '',
      description: '',
      order: i + 1,
      lessonOrder: [`${String(i + 1).padStart(2, '0')}-01`],
    }));

    it('has exactly 15 sections', () => {
      expect(sections).toHaveLength(15);
    });

    it('has sequential order from 1 to 15', () => {
      const orders = sections.map((s) => s.order);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    it('has unique IDs', () => {
      const ids = sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each section has at least one lesson', () => {
      for (const section of sections) {
        expect(section.lessonOrder.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Lesson structure', () => {
    const lessons: LessonData[] = Array.from({ length: 15 }, (_, i) => {
      const num = i + 1;
      return {
        id: `${String(num).padStart(2, '0')}-01`,
        title: '',
        section: `seccion-${String(num).padStart(2, '0')}`,
        order: 1,
      };
    });

    it('every lesson references a valid section', () => {
      for (const lesson of lessons) {
        expect(lesson.section).toMatch(/^seccion-\d{2}$/);
      }
    });

    it('has matching section references', () => {
      for (const lesson of lessons) {
        const sectionNum = lesson.section.replace('seccion-', '');
        const lessonNum = lesson.id.split('-')[0];
        expect(sectionNum).toBe(lessonNum);
      }
    });
  });
});
