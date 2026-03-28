/**
 * Normalizer for markdown2ui markup.
 *
 * Fixes common SLM (small language model) mistakes before strict parsing.
 * Each line is processed independently — the normalizer is stateless.
 */

// ─── Checkbox normalization ─────────────────────────────────────────

// Characters that mean "checked"
const CHECKED_CHARS = new Set(['x', 'X', 'v', 'V', '*', '✓', '√', '✔']);
// Characters that mean "unchecked"
const UNCHECKED_CHARS = new Set([' ', '✗', '✘', '']);

function normalizeCheckboxContent(char: string): 'x' | ' ' {
  if (CHECKED_CHARS.has(char)) return 'x';
  return ' ';
}

// ─── Line normalizers (applied in order) ────────────────────────────

function normalizeLine(line: string): string {
  const trimmed = line.trim();
  if (trimmed === '') return '';

  let result = trimmed;

  // 1. Strip markdown bold/italic from lines that look like label lines
  //    (not starting with a known prefix)
  result = normalizeMarkdownFormatting(result);

  // 2. Normalize checkbox variants: -[X], -[v], -(x), etc.
  result = normalizeCheckbox(result);

  // 3. Normalize list markers: * and + → -
  result = normalizeListMarkers(result);

  // 4. Normalize missing space after prefix: -Option, >Question, >>Question, >!Question
  result = normalizeMissingSpace(result);

  // 5. Normalize sequence delimiters: 1) → 1.
  result = normalizeSequenceDelimiter(result);

  // 6. Normalize @prefix case: @Date → @date, @TIME → @time
  result = normalizeTemporalCase(result);

  // 7. Normalize ? → ?!
  result = normalizeConfirmation(result);

  // 8. Normalize missing upload parens: ![label] → ![label](), [label] → [label]()
  result = normalizeMissingUploadParens(result);

  return result;
}

// Strip **bold** and *italic* wrapping from label lines
// Only applies to lines that don't start with a recognized prefix
function normalizeMarkdownFormatting(line: string): string {
  // Don't touch lines with recognized prefixes
  if (/^[-#>?~@!\[{}\d]/.test(line) || line.startsWith('//')) {
    return line;
  }

  // Strip wrapping bold: **text** → text, __text__ → text
  let result = line;
  if (
    (result.startsWith('**') && result.endsWith('**')) ||
    (result.startsWith('__') && result.endsWith('__'))
  ) {
    result = result.slice(2, -2);
  }
  // Strip wrapping italic: *text* → text, _text_ → text
  else if (
    (result.startsWith('*') && result.endsWith('*') && !result.startsWith('**')) ||
    (result.startsWith('_') && result.endsWith('_') && !result.startsWith('__'))
  ) {
    result = result.slice(1, -1);
  }

  return result;
}

// Normalize checkbox variants to standard - [x] / - [ ]
function normalizeCheckbox(line: string): string {
  // Pattern: optional dash, optional space, bracket/paren, check char, bracket/paren, space, text
  // Matches: -[X] text, - [v] text, -(x) text, -( ) text, -[] text, -[✓] text, etc.

  const m = line.match(
    /^-\s*[\[(]([xXvV*✓√✔✗✘ ]?)[\])]\s+(.+)$/
  );
  if (m) {
    const checked = normalizeCheckboxContent(m[1]);
    return `- [${checked}] ${m[2]}`;
  }

  // Also match without the leading dash (bare brackets)
  // e.g., [x] text, [v] text — but be careful not to match [text](url)
  const m2 = line.match(
    /^[\[(]([xXvV*✓√✔✗✘ ]?)[\])]\s+(.+)$/
  );
  if (m2 && !m2[2].startsWith('(')) {
    const checked = normalizeCheckboxContent(m2[1]);
    return `- [${checked}] ${m2[2]}`;
  }

  return line;
}

// Normalize * and + list markers to -
function normalizeListMarkers(line: string): string {
  // * Option or + Option → - Option
  const m = line.match(/^[*+]\s+(.+)$/);
  if (m) {
    return `- ${m[1]}`;
  }

  // *Option or +Option (missing space) → - Option
  const m2 = line.match(/^[*+]([^\s*+].+)$/);
  if (m2) {
    return `- ${m2[1]}`;
  }

  return line;
}

// Normalize missing space after prefix sigils
function normalizeMissingSpace(line: string): string {
  // >>!text or >>text → >>! text or >> text
  if (line.startsWith('>>') && !line.startsWith('>> ') && !line.startsWith('>>!')) {
    return '>> ' + line.slice(2);
  }
  if (line.startsWith('>>!') && !line.startsWith('>>! ')) {
    return '>>! ' + line.slice(3);
  }

  // >!text or >text → >! text or > text (but not >> which was handled above)
  if (
    line.startsWith('>') &&
    !line.startsWith('>>') &&
    !line.startsWith('> ') &&
    !line.startsWith('>!')
  ) {
    return '> ' + line.slice(1);
  }
  if (line.startsWith('>!') && !line.startsWith('>>') && !line.startsWith('>! ')) {
    return '>! ' + line.slice(2);
  }

  // -text → - text (but not --, ---, -[, -(  which are other patterns)
  if (
    line.startsWith('-') &&
    !line.startsWith('- ') &&
    !line.startsWith('--') &&
    !line.startsWith('-[') &&
    !line.startsWith('-(')
  ) {
    return '- ' + line.slice(1);
  }

  // ~text → ~ text
  if (line.startsWith('~') && !line.startsWith('~ ')) {
    return '~ ' + line.slice(1);
  }

  // #text → # text (but not ## which needs ## text)
  if (line.startsWith('##') && !line.startsWith('## ') && !line.startsWith('###')) {
    return '## ' + line.slice(2);
  }
  if (line.startsWith('#') && !line.startsWith('##') && !line.startsWith('# ')) {
    return '# ' + line.slice(1);
  }

  return line;
}

// Normalize sequence delimiters: 1) → 1., 1: → 1.
function normalizeSequenceDelimiter(line: string): string {
  const m = line.match(/^(\d+)[):]\s+(.+)$/);
  if (m) {
    return `${m[1]}. ${m[2]}`;
  }

  // Also handle missing space: 1)text → 1. text
  const m2 = line.match(/^(\d+)[):]([^\s].+)$/);
  if (m2) {
    return `${m2[1]}. ${m2[2]}`;
  }

  return line;
}

// Normalize @prefix case: @Date → @date, @TIME → @time, @DateTime → @datetime
function normalizeTemporalCase(line: string): string {
  const m = line.match(/^@(datetime|date|time)(.*)/i);
  if (m) {
    return `@${m[1].toLowerCase()}${m[2]}`;
  }
  return line;
}

// Normalize ? Question → ?! Question
function normalizeConfirmation(line: string): string {
  // ? followed by space and text, but NOT ?! (already correct)
  if (line.startsWith('? ') && !line.startsWith('?!')) {
    return '?!' + line.slice(1);
  }
  // ?text (no space) but not ?! — rare but handle it
  if (line.startsWith('?') && !line.startsWith('?!') && !line.startsWith('? ')) {
    return '?! ' + line.slice(1);
  }
  return line;
}

// Normalize missing upload parens: ![label] → ![label](), [label] at line start → [label]()
function normalizeMissingUploadParens(line: string): string {
  // ![label] without () at end
  const imgMatch = line.match(/^!\[(.+)\]$/);
  if (imgMatch) {
    return `![${imgMatch[1]}]()`;
  }

  // [label] at start of line without () — but only if it looks like a standalone upload
  // (the full line is just [label], not [label] embedded in prose)
  const fileMatch = line.match(/^\[(.+)\]$/);
  if (fileMatch) {
    return `[${fileMatch[1]}]()`;
  }

  return line;
}

// ─── Public API ─────────────────────────────────────────────────────

export function normalize(input: string): string {
  return input
    .split('\n')
    .map((line) => normalizeLine(line))
    .join('\n');
}
