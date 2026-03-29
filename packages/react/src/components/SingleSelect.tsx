import { useFormContext } from '../context.js';
import type { SingleSelectBlock } from '@markdown2ui/parser';

function OptionText({ text }: { text: string }) {
  const idx = text.indexOf(':');
  if (idx < 0) return <>{text}</>;
  return <><strong>{text.slice(0, idx)}</strong>:{text.slice(idx + 1)}</>;
}

export function SingleSelect({ block }: { block: SingleSelectBlock }) {
  const { values, setValue } = useFormContext();
  const selected = values[block.id!] as string | undefined;
  const freestyle = values[`${block.id!}__freestyle`] as string | undefined;

  const hasImages = block.options.some((opt) => opt.image);

  return (
    <div className="m2u-card">
      <label className="m2u-label">
        {block.label}
        {block.required && <span className="m2u-required" aria-hidden="true"> *</span>}
      </label>
      {hasImages ? (
        <div className="m2u-image-grid" role="radiogroup" aria-label={block.label}>
          {block.options.map((opt) => (
            <label
              key={opt.text}
              className={`m2u-image-card${selected === opt.text ? ' m2u-image-card--selected' : ''}`}
            >
              <input
                type="radio"
                name={block.id}
                value={opt.text}
                checked={selected === opt.text}
                onChange={() => {
                  setValue(block.id!, opt.text);
                  setValue(`${block.id!}__freestyle`, '');
                }}
              />
              {opt.image && <img className="m2u-image-card-img" src={opt.image} alt={opt.text} />}
              <span className="m2u-image-card-text"><OptionText text={opt.text} /></span>
            </label>
          ))}
        </div>
      ) : (
        <div className="m2u-options" role="radiogroup" aria-label={block.label}>
          {block.options.map((opt) => (
            <label key={opt.text} className={`m2u-option${selected === opt.text ? ' m2u-option--selected' : ''}`}>
              <input
                type="radio"
                name={block.id}
                value={opt.text}
                checked={selected === opt.text}
                onChange={() => {
                  setValue(block.id!, opt.text);
                  setValue(`${block.id!}__freestyle`, '');
                }}
              />
              <span><OptionText text={opt.text} /></span>
            </label>
          ))}
        </div>
      )}
      {!block.required && (
        <input
          type="text"
          className="m2u-freestyle"
          placeholder="Or type your answer..."
          value={freestyle || ''}
          onChange={(e) => {
            setValue(`${block.id!}__freestyle`, e.target.value);
            if (e.target.value) setValue(block.id!, e.target.value);
          }}
        />
      )}
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
