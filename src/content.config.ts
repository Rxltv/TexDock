import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const course = defineCollection({
  loader: file('src/content/course/basic.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    sectionOrder: z.array(z.string()),
  }),
});

const section = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/section' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number(),
    lessonOrder: z.array(z.string()),
  }),
});

const lesson = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lesson' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    section: z.string(),
    order: z.number(),
    description: z.string(),
    objectives: z.array(z.string()).optional(),
    renderMode: z.enum(['KATEX_MATH', 'SAFE_LATEX_PREVIEW']).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }),
});

export const collections = { course, section, lesson };
