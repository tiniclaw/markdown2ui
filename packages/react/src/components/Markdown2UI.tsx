import { useState, useCallback, useMemo } from 'react';
import { parse, normalize } from '@markdown2ui/parser';
import type { AST, Block } from '@markdown2ui/parser';
import { FormContext, type FormValues } from '../context.js';
import { serializeCompact, serializeVerbose } from '../serialize.js';
import { BlockRenderer } from './BlockRenderer.js';

export type SubmitFormat = 'compact' | 'verbose';

export interface Markdown2UIProps {
  /** Raw markdown2ui markup string, or a pre-parsed AST. */
  source: string | AST;
  /** Run the normalizer to fix SLM mistakes. Default: false. */
  normalizeInput?: boolean;
  /** Submission format. Default: 'compact'. */
  format?: SubmitFormat;
  /** Called when the user submits the form. */
  onSubmit?: (result: string | Record<string, any>, ast: AST) => void;
  /** Submit button label. Default: 'Submit'. */
  submitLabel?: string;
  /** Additional class name for the form container. */
  className?: string;
}

function initializeValues(blocks: Block[]): FormValues {
  const values: FormValues = {};

  for (const block of blocks) {
    if (block.type === 'group') {
      Object.assign(values, initializeValues(block.children));
      continue;
    }

    const b = block as any;
    const id = b.id;
    if (!id) continue;

    switch (block.type) {
      case 'single-select': {
        const defaultOpt = b.options.find((o: any) => o.default);
        values[id] = defaultOpt?.text ?? b.options[0]?.text;
        break;
      }
      case 'multi-select': {
        values[id] = b.options.filter((o: any) => o.selected).map((o: any) => o.text);
        break;
      }
      case 'sequence':
        values[id] = [...b.items];
        break;
      case 'confirmation':
        values[id] = false; // default is No
        break;
      case 'text-input':
        values[id] = b.prefill ?? '';
        break;
      case 'typed-input':
        values[id] = b.prefill ?? '';
        break;
      case 'slider':
        values[id] = b.default;
        break;
      case 'date':
      case 'time':
      case 'datetime': {
        if (b.default && b.default !== 'NOW') {
          values[id] = b.default;
        } else {
          const now = new Date();
          if (block.type === 'date') values[id] = now.toISOString().slice(0, 10);
          else if (block.type === 'time') values[id] = now.toTimeString().slice(0, 5);
          else values[id] = now.toISOString().slice(0, 16);
        }
        break;
      }
      case 'file-upload':
      case 'image-upload':
        values[id] = undefined;
        break;
    }
  }

  return values;
}

function validateForm(blocks: Block[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const block of blocks) {
    if (block.type === 'group') {
      Object.assign(errors, validateForm(block.children, values));
      continue;
    }

    const b = block as any;
    if (!b.id) continue;

    const value = values[b.id];

    switch (block.type) {
      case 'text-input':
        if (b.required && (!value || String(value).trim() === '')) {
          errors[b.id] = 'This field is required';
        }
        break;
      case 'typed-input': {
        const val = String(value ?? '').trim();
        if (b.required && val === '') {
          errors[b.id] = 'This field is required';
        } else if (val !== '') {
          if (b.format === 'email' && (!val.includes('@') || !val.includes('.'))) {
            errors[b.id] = 'Enter a valid email';
          }
          if (b.format === 'url' && !val.startsWith('http') && !val.includes('.')) {
            errors[b.id] = 'Enter a valid URL';
          }
          if (b.format === 'tel' && val.replace(/[^\d+]/g, '').length < 7) {
            errors[b.id] = 'Enter a valid phone number';
          }
        }
        break;
      }
      case 'multi-select':
        if (b.required && (!Array.isArray(value) || value.length === 0)) {
          errors[b.id] = 'Select at least one option';
        }
        // Per-option required
        if (b.options) {
          for (const opt of b.options) {
            if (opt.required && (!Array.isArray(value) || !value.includes(opt.text))) {
              errors[b.id] = `"${opt.text}" is required`;
              break;
            }
          }
        }
        break;
      case 'file-upload':
      case 'image-upload':
        if (b.required && !value) {
          errors[b.id] = 'This field is required';
        }
        break;
      case 'date':
      case 'time':
      case 'datetime':
        if (b.required && !value) {
          errors[b.id] = 'This field is required';
        }
        break;
    }
  }

  return errors;
}

export function Markdown2UI({
  source,
  normalizeInput = false,
  format = 'compact',
  onSubmit,
  submitLabel = 'Submit',
  className,
}: Markdown2UIProps) {
  const ast = useMemo<AST>(() => {
    if (typeof source === 'string') {
      return parse(normalizeInput ? normalize(source) : source);
    }
    return source;
  }, [source, normalizeInput]);

  const [values, setValues] = useState<FormValues>(() => initializeValues(ast.blocks));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);

  const currentErrors = useMemo(() => validateForm(ast.blocks, values), [ast.blocks, values]);
  const canSubmit = Object.keys(currentErrors).length === 0;

  const setValue = useCallback((id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  function handleSubmit() {
    setAttempted(true);
    if (!canSubmit) {
      setErrors(currentErrors);
      return;
    }

    if (onSubmit) {
      if (format === 'verbose') {
        onSubmit(serializeVerbose(ast, values), ast);
      } else {
        onSubmit(serializeCompact(ast, values), ast);
      }
    }
  }

  return (
    <FormContext.Provider value={{ values, setValue, errors }}>
      <div className={`m2u-form${className ? ` ${className}` : ''}`}>
        {ast.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
        <button
          type="button"
          className={`m2u-submit${!canSubmit && attempted ? ' m2u-submit--disabled' : ''}`}
          disabled={!canSubmit && attempted}
          onClick={handleSubmit}
        >
          {submitLabel}
        </button>
      </div>
    </FormContext.Provider>
  );
}
