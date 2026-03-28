import { useFormContext } from '../context.js';
import type { DateBlock, TimeBlock, DatetimeBlock } from '@markdown2ui/parser';

type TemporalBlock = DateBlock | TimeBlock | DatetimeBlock;

function getInputType(type: string): string {
  switch (type) {
    case 'date': return 'date';
    case 'time': return 'time';
    case 'datetime': return 'datetime-local';
    default: return 'text';
  }
}

function getDefaultValue(block: TemporalBlock): string {
  if (block.default && block.default !== 'NOW') return block.default;

  const now = new Date();
  switch (block.type) {
    case 'date':
      return now.toISOString().slice(0, 10);
    case 'time':
      return now.toTimeString().slice(0, 5);
    case 'datetime':
      return now.toISOString().slice(0, 16);
    default:
      return '';
  }
}

export function DatePicker({ block }: { block: TemporalBlock }) {
  const { values, setValue, errors } = useFormContext();
  const value = (values[block.id!] as string) ?? getDefaultValue(block);
  const error = errors[block.id!];

  return (
    <div className="m2u-card">
      <label className="m2u-label">
        {block.label}
        {block.required && <span className="m2u-required" aria-hidden="true"> *</span>}
      </label>
      <input
        type={getInputType(block.type)}
        className="m2u-input"
        value={value}
        aria-label={block.label}
        aria-required={block.required || undefined}
        onChange={(e) => setValue(block.id!, e.target.value)}
      />
      {error && <p className="m2u-error">{error}</p>}
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
