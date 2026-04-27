import { useState, useCallback, useMemo } from 'react';
import { parse, normalize } from '@markdown2ui/parser';
import type { AST, Block, Condition } from '@markdown2ui/parser';
import { FormContext, type FormValues, type BlockRendererRegistry } from '../context.js';
import { DEFAULT_STRINGS, type M2UStrings } from '../strings.js';
import { serializeCompact, serializeVerbose } from '../serialize.js';
import { BlockRenderer } from './BlockRenderer.js';

export type SubmitFormat = 'compact' | 'verbose';

export interface Markdown2UIProps {
  /** Raw markup string or pre-parsed AST. */
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
  /** Custom block type renderers, keyed by block type string. */
  blockRenderers?: BlockRendererRegistry;
  /** Override UI strings for localization. */
  strings?: Partial<M2UStrings>;
}

export function isBlockVisible(block: Block, values: FormValues): boolean {
  const cond = (block as any).condition as Condition | undefined;
  if (!cond) return true;
  const fieldVal = String(values[cond.fieldId] ?? '');
  return cond.op === '==' ? fieldVal === cond.value : fieldVal !== cond.value;
}

function initializeRowValues(blocks: Block[]): Record<string, any> {
  const row: Record<string, any> = {};
  for (const block of blocks) {
    const b = block as any;
    if (!b.id) continue;
    switch (block.type) {
      case 'text-input':
      case 'typed-input':
        row[b.id] = b.prefill ?? '';
        break;
      case 'slider':
        row[b.id] = b.default;
        break;
      case 'single-select': {
        const def = b.options?.find((o: any) => o.default);
        row[b.id] = def?.text ?? b.options?.[0]?.text;
        break;
      }
      case 'multi-select':
        row[b.id] = b.options?.filter((o: any) => o.selected).map((o: any) => o.text) ?? [];
        break;
      default:
        row[b.id] = undefined;
    }
  }
  return row;
}

function initializeValues(blocks: Block[]): FormValues {
  const values: FormValues = {};

  for (const block of blocks) {
    if (block.type === 'group') {
      const gKey = block.id ?? block.name;
      if (block.repeatable && gKey) {
        const count = block.minRows ?? 1;
        values[gKey] = Array.from({ length: count }, () =>
          initializeRowValues(block.children)
        );
      } else {
        Object.assign(values, initializeValues(block.children));
      }
      continue;
    }

    if (block.type === 'table' && (block as any).id) {
      values[(block as any).id] = [{}];
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
      case 'multi-select':
        values[id] = b.options.filter((o: any) => o.selected).map((o: any) => o.text);
        break;
      case 'sequence':
        values[id] = [...b.items];
        break;
      case 'confirmation':
        values[id] = false;
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

function validateForm(
  blocks: Block[],
  values: FormValues,
  strings: M2UStrings
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const block of blocks) {
    // Skip blocks hidden by conditions
    if (!isBlockVisible(block, values)) continue;

    if (block.type === 'group') {
      const gKey = block.id ?? block.name;
      if (block.repeatable && gKey) {
        const rows = (values[gKey] as Array<Record<string, any>>) ?? [];
        rows.forEach((row, rowIndex) => {
          const rowErrors = validateForm(block.children, row, strings);
          for (const [fieldId, msg] of Object.entries(rowErrors)) {
            errors[`${gKey}[${rowIndex}].${fieldId}`] = msg;
          }
        });
      } else {
        Object.assign(errors, validateForm(block.children, values, strings));
      }
      continue;
    }

    const b = block as any;
    if (!b.id) continue;
    const value = values[b.id];

    switch (block.type) {
      case 'text-input':
        if (b.required && (!value || String(value).trim() === '')) {
          errors[b.id] = strings.fieldRequired;
        }
        break;
      case 'typed-input': {
        const val = String(value ?? '').trim();
        if (b.required && val === '') {
          errors[b.id] = strings.fieldRequired;
        } else if (val !== '') {
          if (b.format === 'email' && (!val.includes('@') || !val.includes('.'))) {
            errors[b.id] = strings.emailInvalid;
          }
          if (b.format === 'url' && !val.startsWith('http') && !val.includes('.')) {
            errors[b.id] = strings.urlInvalid;
          }
          if (b.format === 'tel' && val.replace(/[^\d+]/g, '').length < 7) {
            errors[b.id] = strings.phoneInvalid;
          }
        }
        break;
      }
      case 'multi-select':
        if (b.required && (!Array.isArray(value) || value.length === 0)) {
          errors[b.id] = strings.selectAtLeastOne;
        }
        if (b.options) {
          for (const opt of b.options) {
            if (opt.required && (!Array.isArray(value) || !value.includes(opt.text))) {
              errors[b.id] = strings.optionRequired(opt.text);
              break;
            }
          }
        }
        break;
      case 'file-upload':
      case 'image-upload':
        if (b.required && !value) errors[b.id] = strings.fieldRequired;
        break;
      case 'date':
      case 'time':
      case 'datetime':
        if (b.required && !value) errors[b.id] = strings.fieldRequired;
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
  blockRenderers,
  strings: stringOverrides,
}: Markdown2UIProps) {
  const ast = useMemo<AST>(() => {
    if (typeof source === 'string') {
      return parse(normalizeInput ? normalize(source) : source);
    }
    return source;
  }, [source, normalizeInput]);

  const strings = useMemo<M2UStrings>(
    () => ({ ...DEFAULT_STRINGS, ...stringOverrides }),
    [stringOverrides]
  );

  const [values, setValues] = useState<FormValues>(() => initializeValues(ast.blocks));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);

  const currentErrors = useMemo(
    () => validateForm(ast.blocks, values, strings),
    [ast.blocks, values, strings]
  );
  const canSubmit = Object.keys(currentErrors).length === 0;

  const setValue = useCallback((id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setGroupValue = useCallback(
    (groupId: string, rowIndex: number, fieldId: string, value: any) => {
      setValues((prev) => {
        const rows = [...((prev[groupId] as Array<Record<string, any>>) ?? [{}])];
        rows[rowIndex] = { ...rows[rowIndex], [fieldId]: value };
        return { ...prev, [groupId]: rows };
      });
    },
    []
  );

  function handleSubmit(extra?: FormValues) {
    const effectiveValues = extra ? { ...values, ...extra } : values;
    const errs = validateForm(ast.blocks, effectiveValues, strings);
    setAttempted(true);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (onSubmit) {
      if (format === 'verbose') {
        onSubmit(serializeVerbose(ast, effectiveValues), ast);
      } else {
        onSubmit(serializeCompact(ast, effectiveValues), ast);
      }
    }
  }

  const confirmationCount = ast.blocks.filter((b) => b.type === 'confirmation').length;
  const hideSubmit = confirmationCount === 1;

  return (
    <FormContext.Provider
      value={{ values, setValue, errors, onSubmit: handleSubmit, setGroupValue, blockRenderers, strings }}
    >
      <div className={`m2u-form${className ? ` ${className}` : ''}`}>
        {ast.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
        {!hideSubmit && (
          <button
            type="button"
            className={`m2u-submit${!canSubmit && attempted ? ' m2u-submit--disabled' : ''}`}
            disabled={!canSubmit && attempted}
            onClick={handleSubmit}
          >
            {submitLabel}
          </button>
        )}
      </div>
    </FormContext.Provider>
  );
}
