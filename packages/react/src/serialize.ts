import type { Block, AST, ComputedExpression } from '@markdown2ui/parser';
import type { FormValues } from './context.js';
import { isBlockVisible } from './components/Markdown2UI.js';

function flattenBlocks(blocks: Block[], values: FormValues): Block[] {
  const result: Block[] = [];
  for (const block of blocks) {
    if (!isBlockVisible(block, values)) continue;

    if (block.type === 'group') {
      if (block.repeatable) {
        // Repeatable groups are handled separately in serializers
        result.push(block);
      } else {
        result.push(...flattenBlocks(block.children, values));
      }
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
  'table',
]);

function evaluateComputed(expression: ComputedExpression, values: FormValues): number {
  if (expression.type === 'count') {
    return expression.fields.reduce((total, fieldId) => {
      const v = values[fieldId];
      if (Array.isArray(v)) return total + v.length;
      return total + (v != null && v !== '' ? 1 : 0);
    }, 0);
  }

  const nums = expression.fields.flatMap((fieldId) => {
    const v = values[fieldId];
    if (Array.isArray(v)) {
      return v.flatMap((item: any) => {
        if (typeof item === 'object') {
          return Object.values(item)
            .map((x) => parseFloat(String(x)))
            .filter((n) => !isNaN(n));
        }
        const n = parseFloat(String(item));
        return isNaN(n) ? [] : [n];
      });
    }
    const n = parseFloat(String(v ?? ''));
    return isNaN(n) ? [] : [n];
  });

  return nums.reduce((a, b) => a + b, 0);
}

export function serializeCompact(ast: AST, values: FormValues): string {
  const entries: string[] = [];

  for (const block of flattenBlocks(ast.blocks, values)) {
    // Computed fields excluded from compact output
    if (block.type === 'computed') continue;

    if (block.type === 'group' && (block as any).repeatable) {
      const groupId = (block as any).id ?? (block as any).name;
      if (!groupId) continue;
      const rows = (values[groupId] as Array<Record<string, any>>) ?? [];
      rows.forEach((row, rowIndex) => {
        for (const child of (block as any).children) {
          const childId = child.id;
          if (!childId || !INTERACTIVE_TYPES.has(child.type)) continue;
          entries.push(`[${groupId}[${rowIndex}].${childId}] ${row[childId] ?? 'null'}`);
        }
      });
      continue;
    }

    if (!INTERACTIVE_TYPES.has(block.type)) continue;
    const id = (block as any).id;
    if (!id) continue;

    if (block.type === 'table') {
      const rows = (values[id] as Array<Record<string, string>>) ?? [];
      rows.forEach((row, rowIndex) => {
        for (const col of (block as any).columns ?? []) {
          entries.push(`[${id}[${rowIndex}].${col.id}] ${row[col.id] ?? 'null'}`);
        }
      });
      continue;
    }

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

  for (const block of flattenBlocks(ast.blocks, values)) {
    if (block.type === 'group' && (block as any).repeatable) {
      const groupId = (block as any).id ?? (block as any).name;
      if (!groupId) continue;
      const rows = (values[groupId] as Array<Record<string, any>>) ?? [];
      result[groupId] = {
        type: 'group',
        repeatable: true,
        rows,
      };
      continue;
    }

    if (block.type === 'computed') {
      const b = block as any;
      if (!b.id) continue;
      result[b.id] = {
        type: 'computed',
        label: b.label,
        computed: true,
        value: evaluateComputed(b.expression, values),
      };
      continue;
    }

    if (!INTERACTIVE_TYPES.has(block.type)) continue;
    const b = block as any;
    const id = b.id;
    if (!id) continue;

    if (block.type === 'table') {
      const rows = (values[id] as Array<Record<string, string>>) ?? [];
      result[id] = {
        type: 'table',
        label: b.label,
        columns: b.columns,
        rows,
      };
      continue;
    }

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
