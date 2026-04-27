import { describe, test, expect } from 'vitest';
import { parse } from '../src/index.js';
import type { ParseOptions } from '../src/index.js';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const TESTS_DIR = resolve(__dirname, '../../../tests');

interface TestCase {
  name: string;
  input: string;
  expected: object;
  options?: ParseOptions;
}

function discoverTests(baseDir: string): TestCase[] {
  const cases: TestCase[] = [];
  const dirs = readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const dirPath = join(baseDir, dir);
    const files = readdirSync(dirPath).filter((f) => f.endsWith('.txt'));

    for (const file of files) {
      const baseName = file.replace(/\.txt$/, '');
      const astFile = join(dirPath, `${baseName}.ast.json`);

      if (!existsSync(astFile)) continue;

      const input = readFileSync(join(dirPath, file), 'utf-8');
      const expected = JSON.parse(readFileSync(astFile, 'utf-8'));

      // Optional per-test ParseOptions sidecar
      const optionsFile = join(dirPath, `${baseName}.options.json`);
      const options: ParseOptions | undefined = existsSync(optionsFile)
        ? JSON.parse(readFileSync(optionsFile, 'utf-8'))
        : undefined;

      cases.push({ name: `${dir}/${baseName}`, input, expected, options });
    }
  }

  return cases;
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

const testCases = discoverTests(TESTS_DIR);

describe('markdown2ui parser conformance', () => {
  test.each(testCases)('$name', ({ input, expected, options }) => {
    const result = parse(input, options);
    const normalizedExpected = replaceNowPlaceholders(expected);
    expect(result).toEqual(normalizedExpected);
  });
});
