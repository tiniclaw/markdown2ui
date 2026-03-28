import { useState } from 'react';
import { useFormContext } from '../context.js';
import type { TypedInputBlock, FormatAnnotation } from '@markdown2ui/parser';

function formatValue(value: string, fmt?: FormatAnnotation): string {
  if (!fmt || !value) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  switch (fmt.type) {
    case 'currency':
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency', currency: fmt.code, maximumFractionDigits: 0,
        }).format(num);
      } catch { return value; }
    case 'unit':
      if (fmt.plural && num !== 1) return `${num.toLocaleString()} ${fmt.plural}`;
      return `${num.toLocaleString()} ${fmt.unit}`;
    case 'percent':
      return `${num.toLocaleString()}%`;
    case 'integer':
      return Math.round(num).toLocaleString();
    case 'decimal':
      return num.toLocaleString(undefined, { minimumFractionDigits: fmt.places, maximumFractionDigits: fmt.places });
    default:
      return value;
  }
}

export function TypedInput({ block }: { block: TypedInputBlock }) {
  const { values, setValue, errors } = useFormContext();
  const rawValue = (values[block.id!] as string) ?? block.prefill ?? '';
  const error = errors[block.id!];
  const [focused, setFocused] = useState(false);
  const hasFmt = block.format === 'number' && block.displayFormat;

  // Show formatted value when not focused, raw when focused
  const displayValue = (!focused && hasFmt)
    ? formatValue(rawValue, block.displayFormat)
    : rawValue;

  // Map format to HTML input attributes
  const inputProps: Record<string, any> = {};
  switch (block.format) {
    case 'email':
      inputProps.type = 'email';
      break;
    case 'tel':
      inputProps.type = 'tel';
      break;
    case 'url':
      inputProps.type = 'url';
      break;
    case 'number':
      inputProps.type = 'text';
      inputProps.inputMode = 'numeric';
      break;
    case 'password':
      inputProps.type = 'password';
      break;
    case 'color':
      inputProps.type = 'color';
      break;
    default:
      inputProps.type = 'text';
  }

  return (
    <div className="m2u-card">
      <label className="m2u-label">
        {block.label}
        {block.required && <span className="m2u-required" aria-hidden="true"> *</span>}
      </label>
      <input
        {...inputProps}
        className="m2u-input"
        placeholder={block.placeholder}
        value={displayValue}
        aria-label={block.label}
        aria-required={block.required || undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setValue(block.id!, e.target.value)}
      />
      {error && <p className="m2u-error">{error}</p>}
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
