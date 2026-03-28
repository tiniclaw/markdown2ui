import { useFormContext } from '../context.js';
import type { TextInputBlock } from '@markdown2ui/parser';

export function TextInput({ block }: { block: TextInputBlock }) {
  const { values, setValue, errors } = useFormContext();
  const value = (values[block.id!] as string) ?? block.prefill ?? '';
  const error = errors[block.id!];

  const label = (
    <label className="m2u-label">
      {block.label}
      {block.required && <span className="m2u-required" aria-hidden="true"> *</span>}
    </label>
  );

  return (
    <div className="m2u-card">
      {label}
      {block.multiline ? (
        <textarea
          className="m2u-textarea"
          placeholder={block.placeholder}
          value={value}
          rows={3}
          aria-label={block.label}
          aria-required={block.required || undefined}
          onChange={(e) => setValue(block.id!, e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="m2u-input"
          placeholder={block.placeholder}
          value={value}
          aria-label={block.label}
          aria-required={block.required || undefined}
          onChange={(e) => setValue(block.id!, e.target.value)}
        />
      )}
      {error && <p className="m2u-error">{error}</p>}
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
