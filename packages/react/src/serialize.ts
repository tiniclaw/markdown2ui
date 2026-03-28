import type { Block, AST } from '@markdown2ui/parser';
import type { FormValues } from './context.js';

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

const INTERACTIVE_TYPES = new Set([
  'single-select',
  'multi-select',
  'sequence',
  'confirmation',
  'text-input',
  'typed-input',
  'slider',
  'date',
  'time',
  'datetime',
  'file-upload',
  'image-upload',
]);

export function serializeCompact(ast: AST, values: FormValues): string {
  const entries: string[] = [];

  for (const block of flattenBlocks(ast.blocks)) {
    if (!INTERACTIVE_TYPES.has(block.type)) continue;
    const id = (block as any).id;
    if (!id) continue;

    const value = values[id];
    let formatted: string;

    switch (block.type) {
      case 'single-select':
        formatted = value ?? 'null';
        break;
      case 'multi-select':
        formatted = Array.isArray(value) ? value.join(', ') : '';
        break;
      case 'sequence':
        formatted = Array.isArray(value) ? value.join(', ') : '';
        break;
      case 'confirmation':
        formatted = value === true ? 'Yes' : 'No';
        break;
      case 'text-input':
      case 'typed-input':
        formatted = value ?? 'null';
        break;
      case 'slider':
        formatted = String(value ?? 'null');
        break;
      case 'date':
      case 'time':
      case 'datetime':
        formatted = value ?? 'null';
        break;
      case 'file-upload':
      case 'image-upload':
        formatted = value ?? 'null';
        break;
      default:
        formatted = 'null';
    }

    entries.push(`[${id}] ${formatted}`);
  }

  return entries.join('\n');
}

export function serializeVerbose(ast: AST, values: FormValues): Record<string, any> {
  const result: Record<string, any> = {};

  for (const block of flattenBlocks(ast.blocks)) {
    if (!INTERACTIVE_TYPES.has(block.type)) continue;
    const b = block as any;
    const id = b.id;
    if (!id) continue;

    const value = values[id];
    const entry: any = {
      type: block.type,
      label: b.label,
      value: value ?? null,
    };

    if (b.hint) entry.hint = b.hint;

    switch (block.type) {
      case 'single-select':
        entry.options = b.options.map((o: any) => o.text);
        break;
      case 'multi-select':
        entry.options = b.options.map((o: any) => ({
          text: o.text,
          selected: Array.isArray(value) ? value.includes(o.text) : false,
        }));
        break;
      case 'sequence':
        entry.items = b.items;
        break;
      case 'slider':
        entry.range = [b.min, b.max];
        if (b.step) entry.step = b.step;
        break;
      case 'text-input':
        entry.multiline = b.multiline;
        break;
      case 'typed-input':
        entry.format = b.format;
        break;
      case 'file-upload':
        if (b.extensions) entry.extensions = b.extensions;
        break;
      case 'confirmation':
        if (b.yesLabel !== 'Yes') entry.yesLabel = b.yesLabel;
        if (b.noLabel !== 'No') entry.noLabel = b.noLabel;
        break;
    }

    result[id] = entry;
  }

  return result;
}
