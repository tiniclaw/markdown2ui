import { describe, test, expect } from 'vitest';
import { parse, normalize } from '../src/index.js';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const TESTS_DIR = resolve(__dirname, '../../../tests/normalizer');

interface NormalizerTestCase {
  name: string;
  input: string;
  normalizedExpected: string;
  astExpected: object;
}

function replaceNowPlaceholders(obj: any): any {
  if (typeof obj === 'string' && obj === 'NOW') {
    return expect.any(String);
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceNowPlaceholders);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceNowPlaceholders(value);
    }
    return result;
  }
  return obj;
}

function discoverTests(baseDir: string): NormalizerTestCase[] {
  if (!existsSync(baseDir)) return [];

  const cases: NormalizerTestCase[] = [];
  const dirs = readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const dirPath = join(baseDir, dir);
    const files = readdirSync(dirPath).filter((f) =>
      f.endsWith('.txt') && !f.endsWith('.normalized.txt')
    );

    for (const file of files) {
      const baseName = file.replace(/\.txt$/, '');
      const normalizedFile = join(dirPath, `${baseName}.normalized.txt`);
      const astFile = join(dirPath, `${baseName}.ast.json`);

      if (!existsSync(normalizedFile) || !existsSync(astFile)) continue;

      cases.push({
        name: `${dir}/${baseName}`,
        input: readFileSync(join(dirPath, file), 'utf-8'),
        normalizedExpected: readFileSync(normalizedFile, 'utf-8'),
        astExpected: JSON.parse(readFileSync(astFile, 'utf-8')),
      });
    }
  }

  return cases;
}

const testCases = discoverTests(TESTS_DIR);

describe('normalizer: text normalization', () => {
  test.each(testCases)('$name produces correct normalized text', ({ input, normalizedExpected }) => {
    const result = normalize(input);
    // Compare trimmed to avoid trailing newline differences
    expect(result.trim()).toBe(normalizedExpected.trim());
  });
});

describe('normalizer: parse with normalize=true produces correct AST', () => {
  test.each(testCases)('$name', ({ input, astExpected }) => {
    const result = parse(input, { normalize: true });
    const normalized = replaceNowPlaceholders(astExpected);
    expect(result).toEqual(normalized);
  });
});
