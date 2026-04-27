import { useMemo } from 'react';
import type { ComputedBlock, FormatAnnotation } from '@markdown2ui/parser';
import { useFormContext } from '../context.js';

function formatResult(value: number, fmt?: FormatAnnotation): string {
  if (!fmt) return String(value);
  switch (fmt.type) {
    case 'currency':
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: fmt.code,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return `${value} ${fmt.code}`;
      }
    case 'unit':
      if (fmt.plural && value !== 1) return `${value.toLocaleString()} ${fmt.plural}`;
      return `${value.toLocaleString()} ${fmt.unit}`;
    case 'percent':
      return `${value.toLocaleString()}%`;
    case 'integer':
      return Math.round(value).toLocaleString();
    case 'decimal':
      return value.toLocaleString(undefined, {
        minimumFractionDigits: fmt.places,
        maximumFractionDigits: fmt.places,
      });
    default:
      return String(value);
  }
}

function resolveNumbers(values: Record<string, any>, fields: string[]): number[] {
  return fields.flatMap((fieldId) => {
    const v = values[fieldId];
    if (Array.isArray(v)) {
      // Repeatable group or table rows
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
}

export function ComputedField({ block }: { block: ComputedBlock }) {
  const { values } = useFormContext();

  const result = useMemo(() => {
    const { expression } = block;
    if (expression.type === 'count') {
      // Count the number of rows/items in the referenced arrays, not numeric values within rows.
      return expression.fields.reduce((total, fieldId) => {
        const v = values[fieldId];
        if (Array.isArray(v)) return total + v.length;
        return total + (v != null && v !== '' ? 1 : 0);
      }, 0);
    }
    const nums = resolveNumbers(values, expression.fields);
    return nums.reduce((a, b) => a + b, 0);
  }, [values, block]);

  const display = formatResult(result, block.displayFormat);

  return (
    <div className="m2u-card m2u-computed">
      <label className="m2u-label">{block.label}</label>
      <div className="m2u-computed-value" aria-live="polite" aria-atomic="true">
        {display}
      </div>
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
