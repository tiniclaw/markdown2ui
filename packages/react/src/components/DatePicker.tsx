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

// Format a stored YYYY-MM-DD or YYYY-MM-DDTHH:mm value for locale display.
// Returns null for 'time' blocks (no locale formatting needed) or unparseable values.
function formatLocaleDate(value: string, type: TemporalBlock['type']): string | null {
  if (!value || type === 'time') return null;
  try {
    if (type === 'date') {
      const [y, mo, d] = value.split('-').map(Number);
      if (!y || !mo || !d) return null;
      // Use local midnight to avoid UTC-offset date shift
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(y, mo - 1, d));
    }
    if (type === 'datetime') {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
    }
    return null;
  } catch {
    return null;
  }
}

export function DatePicker({ block }: { block: TemporalBlock }) {
  const { values, setValue, errors } = useFormContext();
  const value = (values[block.id!] as string) ?? getDefaultValue(block);
  const error = errors[block.id!];
  const localeDisplay = formatLocaleDate(value, block.type);

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
      {localeDisplay && (
        <p className="m2u-date-display" aria-live="polite">{localeDisplay}</p>
      )}
      {error && <p className="m2u-error">{error}</p>}
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
