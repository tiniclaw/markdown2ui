import type { AST, Block } from '@markdown2ui/parser';

type Values = Record<string, any>;

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

const INTERACTIVE = new Set([
  'single-select', 'multi-select', 'sequence', 'confirmation',
  'text-input', 'typed-input', 'slider', 'date', 'time', 'datetime',
  'file-upload', 'image-upload',
]);

export function serializeValues(ast: AST, values: Values): string {
  const lines: string[] = [];

  for (const block of flattenBlocks(ast.blocks)) {
    if (!INTERACTIVE.has(block.type)) continue;
    const id = (block as any).id;
    if (!id) continue;

    const value = values[id];
    let formatted: string;

    switch (block.type) {
      case 'single-select':
        formatted = value ?? 'null';
        break;
      case 'multi-select':
        formatted = Array.isArray(value) && value.length > 0 ? value.join(', ') : '';
        break;
      case 'sequence':
        formatted = Array.isArray(value) ? value.join(', ') : '';
        break;
      case 'confirmation':
        formatted = value === true ? 'Yes' : 'No';
        break;
      case 'slider':
        formatted = String(value ?? 'null');
        break;
      default:
        formatted = value ?? 'null';
    }

    lines.push(`[${id}] ${formatted}`);
  }

  return lines.join('\n');
}
