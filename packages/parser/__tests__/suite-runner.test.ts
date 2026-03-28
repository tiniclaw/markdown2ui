import { describe, test, expect } from 'vitest';
import { parse } from '../src/index.js';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';

const TESTS_DIR = resolve(__dirname, '../../../tests');

interface TestCase {
  name: string;
  input: string;
  expected: object;
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

      cases.push({
        name: `${dir}/${baseName}`,
        input,
        expected,
      });
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
  test.each(testCases)('$name', ({ input, expected }) => {
    const result = parse(input);
    const normalizedExpected = replaceNowPlaceholders(expected);
    expect(result).toEqual(normalizedExpected);
  });
});
