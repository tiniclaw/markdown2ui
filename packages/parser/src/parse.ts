import type {
  AST,
  Block,
  SingleSelectOption,
  MultiSelectOption,
  FormatAnnotation,
  TypedInputFormat,
} from './types.js';
import { deriveId, resolveCollisions, extractIdFromText } from './id.js';
import { normalize } from './normalize.js';

// ─── Line Token Types ────────────────────────────────────────────────

type LineToken =
  | { type: 'divider' }
  | { type: 'header'; level: 1 | 2; text: string }
  | { type: 'hint'; text: string }
  | { type: 'image-upload'; id?: string; label: string; required: boolean }
  | {
      type: 'multi-select-option';
      text: string;
      selected: boolean;
      optionRequired: boolean;
      image?: string;
    }
  | {
      type: 'file-upload';
      id?: string;
      label: string;
      required: boolean;
      extensions?: string[];
    }
  | {
      type: 'text-input';
      multiline: boolean;
      id?: string;
      label: string;
      required: boolean;
      placeholder?: string;
      prefill?: string;
    }
  | {
      type: 'confirmation';
      id?: string;
      label: string;
      yesLabel: string;
      noLabel: string;
    }
  | {
      type: 'typed-input';
      format: TypedInputFormat;
      id?: string;
      label: string;
      required: boolean;
      placeholder?: string;
      prefill?: string;
      displayFormat?: FormatAnnotation;
    }
  | {
      type: 'slider';
      id?: string;
      label: string;
      min: number;
      max: number;
      default: number;
      step?: number;
      displayFormat?: FormatAnnotation;
    }
  | {
      type: 'date' | 'time' | 'datetime';
      id?: string;
      label: string;
      required: boolean;
      default: string;
    }
  | { type: 'group-start'; name?: string }
  | { type: 'group-end' }
  | {
      type: 'sequence-option';
      text: string;
    }
  | {
      type: 'single-select-option';
      text: string;
      isDefault: boolean;
      image?: string;
    }
  | {
      type: 'label-line';
      id?: string;
      label: string;
      required: boolean;
    }
  | { type: 'prose'; text: string }
  | { type: 'blank' };

// ─── Helpers ────────────────────────────────────────────────────────

const LEADING_IMAGE_REGEX = /^!\[[^\]]*\]\(([^)]+)\)\s*/;

function extractLeadingImage(text: string): { image?: string; text: string } {
  const m = text.match(LEADING_IMAGE_REGEX);
  if (m) {
    return { image: m[1], text: text.slice(m[0].length) };
  }
  return { text };
}

// ─── Matchers (Priority Order) ──────────────────────────────────────

function matchDivider(line: string): LineToken | null {
  if (/^-{3,}$/.test(line)) return { type: 'divider' };
  return null;
}

function matchHeader(line: string): LineToken | null {
  const m2 = line.match(/^##\s+(.+)$/);
  if (m2) return { type: 'header', level: 2, text: m2[1] };

  const m1 = line.match(/^#\s+(.+)$/);
  if (m1) return { type: 'header', level: 1, text: m1[1] };

  return null;
}

function matchHint(line: string): LineToken | null {
  const m = line.match(/^\/\/\s*(.*)$/);
  if (m) return { type: 'hint', text: m[1] };
  return null;
}

function matchImageUpload(line: string): LineToken | null {
  const m = line.match(/^!\[(.+)\]\(\)$/);
  if (!m) return null;

  let inner = m[1];
  let id: string | undefined;
  let required = false;

  // Check for ![! label]()
  if (inner.startsWith('! ')) {
    required = true;
    inner = inner.slice(2);
  }

  // Check for ![id!: label]() or ![id: label]()
  const idMatch = inner.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === '!') required = true;
    inner = idMatch[3];
  }

  return { type: 'image-upload', id, label: inner, required };
}

function matchMultiSelectOption(line: string): LineToken | null {
  const m = line.match(/^- \[(x| )\](!)?\s+(.+)$/);
  if (!m) return null;
  const { image, text } = extractLeadingImage(m[3]);
  return {
    type: 'multi-select-option',
    text,
    selected: m[1] === 'x',
    optionRequired: m[2] === '!',
    image,
  };
}

function matchFileUpload(line: string): LineToken | null {
  const m = line.match(/^\[(.+)\]\(([^)]*)\)$/);
  if (!m) return null;

  const parens = m[2].trim();

  // Parens must be empty or contain only extensions like .csv, .xlsx
  if (parens !== '' && !/^(\.[a-zA-Z0-9]+)(,\s*\.[a-zA-Z0-9]+)*$/.test(parens)) {
    return null; // real URL — fall through to prose
  }

  let inner = m[1];
  let id: string | undefined;
  let required = false;

  // Check for [! label]()
  if (inner.startsWith('! ')) {
    required = true;
    inner = inner.slice(2);
  }

  // Check for [id!: label]() or [id: label]()
  const idMatch = inner.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === '!') required = true;
    inner = idMatch[3];
  }

  const extensions = parens
    ? parens.split(/,\s*/).map((e) => e.trim())
    : undefined;

  return { type: 'file-upload', id, label: inner, required, extensions };
}

function matchTextInput(line: string): LineToken | null {
  // >> before >
  const m = line.match(/^(>>?)(!)?\s+(.+)$/);
  if (!m) return null;

  const multiline = m[1] === '>>';
  let required = m[2] === '!';
  let rest = m[3];

  // Extract id
  let id: string | undefined;
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === '!') required = true;
    rest = idMatch[3];
  }

  // Extract prefill (||) before placeholder (|)
  let placeholder: string | undefined;
  let prefill: string | undefined;

  const prefillIdx = rest.indexOf(' || ');
  if (prefillIdx !== -1) {
    prefill = rest.slice(prefillIdx + 4).trim();
    rest = rest.slice(0, prefillIdx);
  }

  const placeholderIdx = rest.indexOf(' | ');
  if (placeholderIdx !== -1) {
    placeholder = rest.slice(placeholderIdx + 3).trim();
    rest = rest.slice(0, placeholderIdx);
  }

  const label = rest.trim();

  return { type: 'text-input', multiline, id, label, required, placeholder, prefill };
}

function matchConfirmation(line: string): LineToken | null {
  const m = line.match(/^\?!\s+(.+)$/);
  if (!m) return null;

  let content = m[1];
  let id: string | undefined;

  // Extract id
  const idMatch = content.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    content = idMatch[3];
  }

  // Look for ternary: question ? yes_label : no_label
  const colonIdx = content.lastIndexOf(' : ');
  if (colonIdx >= 0) {
    const qmarkIdx = content.lastIndexOf(' ? ', colonIdx);
    if (qmarkIdx >= 0) {
      const question = content.slice(0, qmarkIdx);
      const yesLabel = content.slice(qmarkIdx + 3, colonIdx);
      const noLabel = content.slice(colonIdx + 3);
      return { type: 'confirmation', id, label: question, yesLabel, noLabel };
    }
  }

  return { type: 'confirmation', id, label: content, yesLabel: 'Yes', noLabel: 'No' };
}

function matchSlider(line: string): LineToken | null {
  const m = line.match(/^~\s+(.+)$/);
  if (!m) return null;

  let rest = m[1];
  let id: string | undefined;

  // Extract id
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    rest = idMatch[3];
  }

  // Extract format annotation from end before parsing slider syntax
  const formatParsed = parseFormatAnnotation(rest);
  rest = formatParsed.rest;

  // Parse: Label [min - max] (default) %step
  // Supports both integers and decimals
  const NUM = '\\d+(?:\\.\\d+)?';
  const sliderMatch = rest.match(
    new RegExp(`^(.+?)\\s*\\[(${NUM})\\s*-\\s*(${NUM})\\]\\s*\\((${NUM})\\)(?:\\s*%(${NUM}))?$`)
  );
  if (!sliderMatch) return null;

  return {
    type: 'slider',
    id,
    label: sliderMatch[1].trim(),
    min: parseFloat(sliderMatch[2]),
    max: parseFloat(sliderMatch[3]),
    default: parseFloat(sliderMatch[4]),
    step: sliderMatch[5] ? parseFloat(sliderMatch[5]) : undefined,
    displayFormat: formatParsed.format,
  };
}

// ─── Format Annotation Parser ───────────────────────────────────────

function parseFormatAnnotation(text: string): { rest: string; format?: FormatAnnotation } {
  // @currency(CODE)
  const currencyMatch = text.match(/\s+@currency\(([A-Za-z]{3})\)\s*$/);
  if (currencyMatch) {
    return { rest: text.slice(0, currencyMatch.index!), format: { type: 'currency', code: currencyMatch[1].toUpperCase() } };
  }

  // @unit(UNIT) or @unit(singular|plural)
  const unitMatch = text.match(/\s+@unit\(([^)]+)\)\s*$/);
  if (unitMatch) {
    const parts = unitMatch[1].split('|');
    const format: any = { type: 'unit', unit: parts[0] };
    if (parts.length > 1) format.plural = parts[1];
    return { rest: text.slice(0, unitMatch.index!), format };
  }

  // @percent
  const percentMatch = text.match(/\s+@percent\s*$/);
  if (percentMatch) {
    return { rest: text.slice(0, percentMatch.index!), format: { type: 'percent' } };
  }

  // @integer
  const intMatch = text.match(/\s+@integer\s*$/);
  if (intMatch) {
    return { rest: text.slice(0, intMatch.index!), format: { type: 'integer' } };
  }

  // @decimal(N)
  const decMatch = text.match(/\s+@decimal\((\d+)\)\s*$/);
  if (decMatch) {
    return { rest: text.slice(0, decMatch.index!), format: { type: 'decimal', places: parseInt(decMatch[1], 10) } };
  }

  return { rest: text };
}

// ─── Typed Input Matcher ────────────────────────────────────────────

const TYPED_INPUT_FORMATS = new Set(['email', 'tel', 'url', 'number', 'password', 'color']);

function matchTypedInput(line: string): LineToken | null {
  const m = line.match(/^@(email|tel|url|number|password|color)(!)?\s+(.+)$/);
  if (!m) return null;

  const inputFormat = m[1] as TypedInputFormat;
  let required = m[2] === '!';
  let rest = m[3];

  let id: string | undefined;
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === '!') required = true;
    rest = idMatch[3];
  }

  // Extract format annotation (for @number)
  let displayFormat: FormatAnnotation | undefined;
  if (inputFormat === 'number') {
    const parsed = parseFormatAnnotation(rest);
    rest = parsed.rest;
    displayFormat = parsed.format;
  }

  // Extract prefill (||) before placeholder (|)
  let placeholder: string | undefined;
  let prefill: string | undefined;

  const prefillIdx = rest.indexOf(' || ');
  if (prefillIdx !== -1) {
    prefill = rest.slice(prefillIdx + 4).trim();
    rest = rest.slice(0, prefillIdx);
  }

  const placeholderIdx = rest.indexOf(' | ');
  if (placeholderIdx !== -1) {
    placeholder = rest.slice(placeholderIdx + 3).trim();
    rest = rest.slice(0, placeholderIdx);
  }

  return {
    type: 'typed-input',
    format: inputFormat,
    id,
    label: rest.trim(),
    required,
    placeholder,
    prefill,
    displayFormat,
  };
}

function matchTemporal(line: string): LineToken | null {
  // @datetime before @date and @time
  const m = line.match(/^@(datetime|date|time)(!)?\s+(.+)$/);
  if (!m) return null;

  const temporalType = m[1] as 'datetime' | 'date' | 'time';
  let required = m[2] === '!';
  let rest = m[3];

  let id: string | undefined;
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === '!') required = true;
    rest = idMatch[3];
  }

  // Extract default value after |
  let defaultValue = 'NOW';
  const pipeIdx = rest.indexOf(' | ');
  if (pipeIdx !== -1) {
    defaultValue = rest.slice(pipeIdx + 3).trim();
    rest = rest.slice(0, pipeIdx);
  }

  return {
    type: temporalType,
    id,
    label: rest.trim(),
    required,
    default: defaultValue,
  };
}

function matchGroupStart(line: string): LineToken | null {
  const m = line.match(/^\{\s*(.*)$/);
  if (!m) return null;
  const name = m[1].trim() || undefined;
  return { type: 'group-start', name };
}

function matchGroupEnd(line: string): LineToken | null {
  if (line === '}') return { type: 'group-end' };
  return null;
}

function matchSequenceOption(line: string): LineToken | null {
  const m = line.match(/^\d+\.\s+(.+)$/);
  if (!m) return null;
  return { type: 'sequence-option', text: m[1] };
}

function matchSingleSelectOption(line: string): LineToken | null {
  const m = line.match(/^-\s+(.+)$/);
  if (!m) return null;

  let text = m[1];
  let isDefault = false;

  if (text.endsWith(' (default)')) {
    isDefault = true;
    text = text.slice(0, -' (default)'.length);
  }

  const { image, text: cleanText } = extractLeadingImage(text);
  return { type: 'single-select-option', text: cleanText, isDefault, image };
}

function matchLabelLine(
  line: string,
  nextLine: string | null
): LineToken | null {
  if (nextLine === null) return null;

  // Check if next line starts a select/sequence group
  const isNextSelect =
    /^-\s+/.test(nextLine) || /^- \[(x| )\]\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine);

  if (!isNextSelect) return null;

  const info = extractIdFromText(line);
  return {
    type: 'label-line',
    id: info.id,
    label: info.label,
    required: info.required,
  };
}

// ─── Tokenizer ──────────────────────────────────────────────────────

function classifyLine(line: string, nextLine: string | null): LineToken {
  // Priority-ordered matching
  return (
    matchDivider(line) ??
    matchHeader(line) ??
    matchHint(line) ??
    matchImageUpload(line) ??
    matchMultiSelectOption(line) ??
    matchFileUpload(line) ??
    matchTextInput(line) ??
    matchConfirmation(line) ??
    matchSlider(line) ??
    matchTypedInput(line) ??
    matchTemporal(line) ??
    matchGroupStart(line) ??
    matchGroupEnd(line) ??
    matchSequenceOption(line) ??
    matchSingleSelectOption(line) ??
    matchLabelLine(line, nextLine) ?? { type: 'prose', text: line }
  );
}

function tokenize(input: string): LineToken[] {
  const rawLines = input.split('\n');
  const tokens: LineToken[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trimEnd();

    if (line.trim() === '') {
      tokens.push({ type: 'blank' });
      continue;
    }

    const trimmed = line.trim();

    // Handle escaped prefixes
    if (trimmed.startsWith('\\')) {
      const unescaped = trimmed.slice(1);
      tokens.push({ type: 'prose', text: unescaped });
      continue;
    }

    // Find next non-blank line for lookahead
    let nextLine: string | null = null;
    for (let j = i + 1; j < rawLines.length; j++) {
      const candidate = rawLines[j].trim();
      if (candidate !== '') {
        nextLine = candidate;
        break;
      }
    }

    tokens.push(classifyLine(trimmed, nextLine));
  }

  return tokens;
}

// ─── Assembler ──────────────────────────────────────────────────────

type InteractiveBlock = Exclude<Block, { type: 'header' | 'hint' | 'divider' | 'prose' | 'group' }>;

function isInteractive(block: Block): block is InteractiveBlock {
  return ![
    'header',
    'hint',
    'divider',
    'prose',
    'group',
  ].includes(block.type);
}

function assemble(tokens: LineToken[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  // Pending state for select/sequence groups
  let pendingLabel: { id?: string; label: string; required: boolean } | null = null;
  let groupStack: { name?: string; children: Block[] } | null = null;

  function addBlock(block: Block) {
    if (groupStack) {
      groupStack.children.push(block);
    } else {
      blocks.push(block);
    }
  }

  function lastBlock(): Block | undefined {
    if (groupStack && groupStack.children.length > 0) {
      return groupStack.children[groupStack.children.length - 1];
    }
    if (blocks.length > 0) {
      return blocks[blocks.length - 1];
    }
    return undefined;
  }

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'blank') {
      pendingLabel = null;
      i++;
      continue;
    }

    if (token.type === 'label-line') {
      pendingLabel = { id: token.id, label: token.label, required: token.required };
      i++;
      continue;
    }

    if (token.type === 'hint') {
      const prev = lastBlock();
      if (prev && 'hint' in prev) {
        prev.hint = prev.hint ? prev.hint + '\n' + token.text : token.text;
      } else if (prev) {
        (prev as any).hint = token.text;
      }
      i++;
      continue;
    }

    if (token.type === 'group-start') {
      groupStack = { name: token.name, children: [] };
      i++;
      continue;
    }

    if (token.type === 'group-end') {
      if (groupStack) {
        const group: Block = { type: 'group', children: groupStack.children };
        if (groupStack.name) (group as any).name = groupStack.name;
        blocks.push(group);
        groupStack = null;
      }
      i++;
      continue;
    }

    // Collect single-select options
    if (token.type === 'single-select-option') {
      const options: SingleSelectOption[] = [];
      while (i < tokens.length && tokens[i].type === 'single-select-option') {
        const opt = tokens[i] as Extract<LineToken, { type: 'single-select-option' }>;
        const option: SingleSelectOption = { text: opt.text, default: opt.isDefault };
        if (opt.image) option.image = opt.image;
        options.push(option);
        i++;
      }

      // If no explicit default, first option is default
      if (!options.some((o) => o.default)) {
        options[0].default = true;
      }

      const label = pendingLabel?.label ?? options[0].text;
      const block: Block = {
        type: 'single-select',
        id: pendingLabel?.id,
        label,
        options,
      };
      if (pendingLabel?.required) (block as any).required = true;
      addBlock(block);
      pendingLabel = null;
      continue;
    }

    // Collect multi-select options
    if (token.type === 'multi-select-option') {
      const options: MultiSelectOption[] = [];
      while (i < tokens.length && tokens[i].type === 'multi-select-option') {
        const opt = tokens[i] as Extract<LineToken, { type: 'multi-select-option' }>;
        const option: any = { text: opt.text, selected: opt.selected };
        if (opt.optionRequired) option.required = true;
        if (opt.image) option.image = opt.image;
        options.push(option);
        i++;
      }

      const label = pendingLabel?.label ?? options[0].text;
      const block: Block = {
        type: 'multi-select',
        id: pendingLabel?.id,
        label,
        options,
      };
      if (pendingLabel?.required) (block as any).required = true;
      addBlock(block);
      pendingLabel = null;
      continue;
    }

    // Collect sequence options
    if (token.type === 'sequence-option') {
      const items: string[] = [];
      while (i < tokens.length && tokens[i].type === 'sequence-option') {
        const opt = tokens[i] as Extract<LineToken, { type: 'sequence-option' }>;
        items.push(opt.text);
        i++;
      }

      const label = pendingLabel?.label ?? items[0];
      const block: Block = {
        type: 'sequence',
        id: pendingLabel?.id,
        label,
        items,
      };
      addBlock(block);
      pendingLabel = null;
      continue;
    }

    // Direct block tokens
    if (token.type === 'header') {
      addBlock({ type: 'header', level: token.level, text: token.text });
      i++;
      continue;
    }

    if (token.type === 'divider') {
      addBlock({ type: 'divider' });
      i++;
      continue;
    }

    if (token.type === 'prose') {
      addBlock({ type: 'prose', text: token.text });
      i++;
      continue;
    }

    if (token.type === 'confirmation') {
      const block: Block = {
        type: 'confirmation',
        id: token.id,
        label: token.label,
        yesLabel: token.yesLabel,
        noLabel: token.noLabel,
      };
      addBlock(block);
      i++;
      continue;
    }

    if (token.type === 'text-input') {
      const block: any = {
        type: 'text-input',
        id: token.id,
        label: token.label,
        multiline: token.multiline,
      };
      if (token.required) block.required = true;
      if (token.placeholder) block.placeholder = token.placeholder;
      if (token.prefill) block.prefill = token.prefill;
      addBlock(block);
      i++;
      continue;
    }

    if (token.type === 'typed-input') {
      const block: any = {
        type: 'typed-input',
        id: token.id,
        label: token.label,
        format: token.format,
      };
      if (token.required) block.required = true;
      if (token.placeholder) block.placeholder = token.placeholder;
      if (token.prefill) block.prefill = token.prefill;
      if (token.displayFormat) block.displayFormat = token.displayFormat;
      addBlock(block);
      i++;
      continue;
    }

    if (token.type === 'slider') {
      const block: any = {
        type: 'slider',
        id: token.id,
        label: token.label,
        min: token.min,
        max: token.max,
        default: token.default,
      };
      if (token.step !== undefined) block.step = token.step;
      if (token.displayFormat) block.displayFormat = token.displayFormat;
      addBlock(block);
      i++;
      continue;
    }

    if (
      token.type === 'date' ||
      token.type === 'time' ||
      token.type === 'datetime'
    ) {
      const block: any = {
        type: token.type,
        id: token.id,
        label: token.label,
        default: token.default,
      };
      if (token.required) block.required = true;
      addBlock(block);
      i++;
      continue;
    }

    if (token.type === 'file-upload') {
      const block: any = {
        type: 'file-upload',
        id: token.id,
        label: token.label,
      };
      if (token.required) block.required = true;
      if (token.extensions) block.extensions = token.extensions;
      addBlock(block);
      i++;
      continue;
    }

    if (token.type === 'image-upload') {
      const block: any = {
        type: 'image-upload',
        id: token.id,
        label: token.label,
      };
      if (token.required) block.required = true;
      addBlock(block);
      i++;
      continue;
    }

    // Fallback: skip unknown tokens
    i++;
  }

  // Close unclosed group
  if (groupStack) {
    const group: Block = { type: 'group', children: groupStack.children };
    if (groupStack.name) (group as any).name = groupStack.name;
    blocks.push(group);
  }

  return blocks;
}

// ─── Post-Processing ────────────────────────────────────────────────

function assignIds(blocks: Block[]): void {
  const allBlocks = flattenBlocks(blocks);
  const ids: (string | undefined)[] = [];
  const interactiveBlocks: Block[] = [];

  for (const block of allBlocks) {
    if (isInteractive(block)) {
      if (!(block as any).id) {
        (block as any).id = deriveId((block as any).label);
      }
      ids.push((block as any).id);
      interactiveBlocks.push(block);
    }
  }

  // Resolve collisions
  resolveCollisions(ids);
  for (let i = 0; i < interactiveBlocks.length; i++) {
    (interactiveBlocks[i] as any).id = ids[i];
  }
}

function flattenBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];
  for (const block of blocks) {
    if (block.type === 'group') {
      result.push(...flattenBlocks(block.children));
    } else {
      result.push(block);
    }
  }
  return result;
}

function cleanBlock(block: any): void {
  // Remove undefined fields for clean JSON output
  for (const key of Object.keys(block)) {
    if (block[key] === undefined) {
      delete block[key];
    }
  }
  if (block.type === 'group' && block.children) {
    for (const child of block.children) {
      cleanBlock(child);
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────

export interface ParseOptions {
  /** Run the normalizer to fix common SLM mistakes before parsing. Default: false. */
  normalize?: boolean;
}

export function parse(input: string, options?: ParseOptions): AST {
  let source = input;
  if (options?.normalize) {
    source = normalize(source);
  }

  const tokens = tokenize(source);
  const blocks = assemble(tokens);
  assignIds(blocks);

  for (const block of blocks) {
    cleanBlock(block);
  }

  return { version: '0.9', blocks };
}
