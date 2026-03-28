import type { AST, Block } from '@markdown2ui/parser';

type Values = Record<string, any>;

function flattenBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];
  for (const block of blocks) {
    if (block.type === 'group') result.push(...flattenBlocks(block.children));
    else result.push(block);
  }
  return result;
}

export function validateForm(ast: AST, values: Values): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const block of flattenBlocks(ast.blocks)) {
    const b = block as any;
    const id = b.id;
    if (!id) continue;

    switch (block.type) {
      case 'text-input':
        if (b.required && (!values[id] || String(values[id]).trim() === '')) {
          errors[id] = 'This field is required';
        }
        break;
      case 'typed-input': {
        const val = values[id] as string ?? '';
        if (b.required && val.trim() === '') {
          errors[id] = 'This field is required';
        } else if (val.trim() !== '') {
          if (b.format === 'email' && (!val.includes('@') || !val.includes('.'))) {
            errors[id] = 'Enter a valid email';
          }
          if (b.format === 'url' && !val.startsWith('http') && !val.includes('.')) {
            errors[id] = 'Enter a valid URL';
          }
          if (b.format === 'tel' && val.replace(/[^\d+]/g, '').length < 7) {
            errors[id] = 'Enter a valid phone number';
          }
        }
        break;
      }
      case 'multi-select':
        if (b.required) {
          const sel = values[id] as string[] ?? [];
          if (sel.length === 0) errors[id] = 'Select at least one option';
        }
        // Per-option required
        if (b.options) {
          for (const opt of b.options) {
            if (opt.required) {
              const sel = values[id] as string[] ?? [];
              if (!sel.includes(opt.text)) {
                errors[id] = `"${opt.text}" is required`;
                break;
              }
            }
          }
        }
        break;
    }
  }

  return errors;
}
