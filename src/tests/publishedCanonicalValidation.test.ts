import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateExercise, type ValidationRule } from '../lib/exercises/validateExercise';

interface PublishedExercise {
  id: string;
  status: string;
  canonicalSolution: string;
  validationRules: ValidationRule[];
}

const exerciseRoot = resolve('src/content/exercise');
const exercises = readdirSync(exerciseRoot)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => {
    const exercise = JSON.parse(readFileSync(resolve(exerciseRoot, name), 'utf8')) as PublishedExercise;
    expect(exercise.id, name).toBe(name.slice(0, -5));
    return exercise;
  })
  .filter((exercise) => exercise.status === 'published');

describe('soluciones canónicas publicadas', () => {
  it('descubre las 236 soluciones publicadas', () => {
    expect(exercises).toHaveLength(236);
  });

  it.each(exercises.map((exercise) => [exercise.id, exercise] as const))(
    '%s aprueba todas sus reglas declaradas',
    (_id, exercise) => {
      expect(exercise.canonicalSolution.trim(), exercise.id).not.toBe('');
      const result = validateExercise(exercise.canonicalSolution, exercise.validationRules);
      expect(result.unsupportedRules, exercise.id).toEqual([]);
      expect(result.failedRules, exercise.id).toEqual([]);
      expect(result.valid, exercise.id).toBe(true);
    },
  );
});
