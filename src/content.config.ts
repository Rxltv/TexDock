import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const renderModeEnum = z.enum(['KATEX_MATH', 'SAFE_LATEX_PREVIEW']);
const statusEnum = z.enum(['draft', 'published', 'archived']);
const actionEnum = z.enum(['copy', 'clear', 'restore']);
const kebabSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const activeSectionPatterns = ['seccion-0[1-9].json', 'seccion-1[0-5].json'];
const activeLessonPatterns = ['0[1-9]-*.md', '10-*.md', '11-*.md', '12-*.md', '13-*.md', '14-*.md', '15-*.md'];
const activePagePatterns = ['0[1-9]-*.md', '10-*.md', '11-*.md', '12-*.md', '13-*.md', '14-*.md', '15-*.md'];
const activeExercisePatterns = ['0[1-9]-*.json', '10-*.json', '11-*.json', '12-*.json', '13-*.json', '14-*.json', '15-*.json'];

const course = defineCollection({
  loader: file('src/content/course/basic.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
  }),
});

const section = defineCollection({
  loader: glob({ pattern: activeSectionPatterns, base: './src/content/section' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number(),
    courseId: z.string(),
  }),
});

const lesson = defineCollection({
  loader: glob({ pattern: activeLessonPatterns, base: './src/content/lesson' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    sectionId: z.string(),
    order: z.number(),
    description: z.string(),
    objectives: z.array(z.string()).optional(),
    status: statusEnum.optional(),
  }),
});

const lessonPage = defineCollection({
  loader: glob({ pattern: activePagePatterns, base: './src/content/lesson-page' }),
  schema: z.object({
    id: z.string().min(1),
    lessonId: z.string().min(1),
    slug: kebabSlug,
    title: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().positive(),
    status: statusEnum,
    objectives: z.array(z.string().min(1)).optional(),
    renderMode: renderModeEnum.optional(),
  }),
});

const example = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/example' }),
  schema: z.object({
    id: z.string(),
    pageId: z.string(),
    order: z.number().int().positive(),
    title: z.string(),
    description: z.string(),
    editable: z.boolean(),
    initialCode: z.string().optional().default(''),
    renderMode: renderModeEnum,
    packages: z.array(z.string()),
    explanation: z.string(),
    expectedPreview: z.string().optional(),
    actions: z.array(actionEnum),
    status: statusEnum,
  }).superRefine((data, ctx) => {
    const unique = new Set(data.actions);
    if (unique.size !== data.actions.length) {
      ctx.addIssue({ code: 'custom', message: 'actions must not contain duplicates', path: ['actions'] });
    }
    if (data.editable) {
      const required = ['copy', 'clear', 'restore'];
      for (const a of required) {
        if (!data.actions.includes(a as 'copy' | 'clear' | 'restore')) {
          ctx.addIssue({ code: 'custom', message: `editable example must include action "${a}"`, path: ['actions'] });
        }
      }
    } else {
      const allowed = ['copy'];
      for (const a of data.actions) {
        if (!allowed.includes(a)) {
          ctx.addIssue({ code: 'custom', message: `non-editable example can only use action "copy", got "${a}"`, path: ['actions'] });
        }
      }
    }
  }),
});

const ruleTypeEnum = z.enum([
  'REQUIRE_COMMAND',
  'REQUIRE_ENVIRONMENT',
  'REQUIRE_ARGUMENT',
  'REQUIRE_TEXT',
  'REQUIRE_PACKAGE',
  'REQUIRE_MATH_STRUCTURE',
  'REQUIRE_ORDER',
  'REQUIRE_VALID_FOOTNOTES',
  'REQUIRE_FOOTNOTE_PAIR',
  'REQUIRE_UNIQUE_LABELS',
  'REQUIRE_RESOLVED_REFERENCES',
  'REQUIRE_VALID_LABELS',
  'REQUIRE_REFERENCE_PACKAGE_ORDER',
  'REQUIRE_REFERENCE_COUNT',
  'REQUIRE_VALID_BIBLIOGRAPHY',
  'REQUIRE_BIBITEM_COUNT',
  'REQUIRE_RESOLVED_CITATIONS',
  'REQUIRE_CITATION_COUNT',
  'REQUIRE_VALID_DOCUMENT',
  'REQUIRE_USED_PACKAGES',
  'REQUIRE_PROJECT_REQUIREMENTS',
  'REQUIRE_PARAGRAPH_COUNT',
  'REQUIRE_DISTINCT_LINES',
  'REQUIRE_NESTED_ENVIRONMENT',
  'REQUIRE_MATCHING_ARGUMENTS',
  'FORBID_ALTERNATIVE',
]);

const ruleScopeEnum = z.enum(['PREAMBLE', 'BODY', 'MATH', 'FULL_DOCUMENT']);

const validationRule = z.object({
  id: z.string(),
  type: ruleTypeEnum,
  required: z.boolean(),
  scope: ruleScopeEnum,
  target: z.string().optional(),
  expected: z.unknown().optional(),
  arguments: z.unknown().optional(),
  normalization: z.array(z.string()).optional(),
  feedback: z.string(),
  orderSensitive: z.boolean().optional(),
});

const exercise = defineCollection({
  loader: glob({ pattern: activeExercisePatterns, base: './src/content/exercise' }),
  schema: z.object({
    id: z.string(),
    pageId: z.string(),
    order: z.number().int().positive(),
    title: z.string(),
    description: z.string(),
    instructions: z.string(),
    required: z.boolean(),
    initialCode: z.string().optional().default(''),
    renderMode: renderModeEnum,
    packages: z.array(z.string()),
    objective: z.string(),
    canonicalSolution: z.string().optional().default(''),
    validationRules: z.array(validationRule),
    variants: z.array(z.object({
      id: z.string(),
      instructions: z.string().optional(),
      initialCode: z.string().optional(),
      canonicalSolution: z.string().optional(),
    })).max(5).optional().default([]),
    successFeedback: z.string(),
    solutionExplanation: z.string(),
    status: statusEnum,
  }).superRefine((data, ctx) => {
    if (data.status === 'published' && data.canonicalSolution.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'published exercise must have a non-empty canonicalSolution', path: ['canonicalSolution'] });
    }
    const variantIds = data.variants.map((v) => v.id);
    const uniqueVariantIds = new Set(variantIds);
    if (uniqueVariantIds.size !== variantIds.length) {
      ctx.addIssue({ code: 'custom', message: 'variant IDs must be unique within an exercise', path: ['variants'] });
    }
  }),
});

export const collections = { course, section, lesson, lessonPage, example, exercise };
