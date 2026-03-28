import { useFormContext } from '../context.js';
import type { MultiSelectBlock } from '@markdown2ui/parser';

export function MultiSelect({ block }: { block: MultiSelectBlock }) {
  const { values, setValue } = useFormContext();
  const selected = (values[block.id!] as string[]) || [];

  function toggle(text: string) {
    const next = selected.includes(text)
      ? selected.filter((s) => s !== text)
      : [...selected, text];
    setValue(block.id!, next);
  }

  const hasImages = block.options.some((opt) => opt.image);

  return (
    <div className="m2u-card">
      <label className="m2u-label">
        {block.label}
        {block.required && <span className="m2u-required" aria-hidden="true"> *</span>}
      </label>
      {hasImages ? (
        <div className="m2u-image-grid" role="group" aria-label={block.label}>
          {block.options.map((opt) => (
            <label
              key={opt.text}
              className={`m2u-image-card${selected.includes(opt.text) ? ' m2u-image-card--selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.text)}
                onChange={() => toggle(opt.text)}
              />
              {opt.image && <img className="m2u-image-card-img" src={opt.image} alt={opt.text} />}
              <span className="m2u-image-card-text">{opt.text}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="m2u-options" role="group" aria-label={block.label}>
          {block.options.map((opt) => (
            <label key={opt.text} className={`m2u-option${selected.includes(opt.text) ? ' m2u-option--selected' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(opt.text)}
                onChange={() => toggle(opt.text)}
              />
              <span>{opt.text}</span>
            </label>
          ))}
        </div>
      )}
      <input
        type="text"
        className="m2u-freestyle"
        placeholder="Or add your own..."
        value={values[`${block.id!}__freestyle`] || ''}
        onChange={(e) => setValue(`${block.id!}__freestyle`, e.target.value)}
      />
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
