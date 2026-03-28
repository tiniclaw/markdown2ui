import { useFormContext } from '../context.js';
import type { SliderBlock, FormatAnnotation } from '@markdown2ui/parser';

function formatDisplayValue(value: number, fmt?: FormatAnnotation): string {
  if (!fmt) return String(value);
  switch (fmt.type) {
    case 'currency':
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency', currency: fmt.code, maximumFractionDigits: 0,
        }).format(value);
      } catch { return `${value} ${fmt.code}`; }
    case 'unit':
      if (fmt.plural && value !== 1) return `${value.toLocaleString()} ${fmt.plural}`;
      return `${value.toLocaleString()} ${fmt.unit}`;
    case 'percent':
      return `${value.toLocaleString()}%`;
    case 'integer':
      return Math.round(value).toLocaleString();
    case 'decimal':
      return value.toLocaleString(undefined, { minimumFractionDigits: fmt.places, maximumFractionDigits: fmt.places });
    default:
      return String(value);
  }
}

export function Slider({ block }: { block: SliderBlock }) {
  const { values, setValue } = useFormContext();
  const value = (values[block.id!] as number) ?? block.default;
  const fmt = block.displayFormat;

  return (
    <div className="m2u-card">
      <label className="m2u-label">{block.label}</label>
      <div className="m2u-slider-container">
        <span className="m2u-slider-min">{formatDisplayValue(block.min, fmt)}</span>
        <input
          type="range"
          className="m2u-slider"
          min={block.min}
          max={block.max}
          step={block.step || 1}
          value={value}
          aria-label={block.label}
          aria-valuemin={block.min}
          aria-valuemax={block.max}
          aria-valuenow={value}
          onChange={(e) => setValue(block.id!, Number(e.target.value))}
        />
        <span className="m2u-slider-max">{formatDisplayValue(block.max, fmt)}</span>
      </div>
      <div className="m2u-slider-value">{formatDisplayValue(value, fmt)}</div>
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
