/**
 * shadcn/ui-style renderer.
 * Uses plain HTML + CSS that mimics shadcn's aesthetic (Radix-inspired).
 * No actual shadcn dependency — just the visual style.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Block } from '@markdown2ui/parser';
import type { RendererProps } from './types';
import { serializeValues } from './serialize';
import { formatDisplayValue } from './formatValue';
import { IconText, OptionIconText } from './IconText';
import { validateForm } from './validate';

type Values = Record<string, any>;

function ShadcnBlock({ block, values, setValue, onSubmit }: { block: Block; values: Values; setValue: (id: string, v: any) => void; onSubmit?: () => void }) {
  switch (block.type) {
    case 'header':
      return block.level === 1
        ? <h2 className="sh-h1"><IconText text={block.text} /></h2>
        : <h3 className="sh-h2"><IconText text={block.text} /></h3>;

    case 'prose':
      return <p className="sh-prose"><IconText text={block.text} /></p>;

    case 'divider':
      return <div className="sh-divider" />;

    case 'single-select': {
      const selected = values[block.id!] as string;
      const hasImages = block.options.some((o) => o.image);
      return (
        <div className="sh-field">
          <label className="sh-label"><IconText text={block.label} />{block.required && <span className="sh-required">*</span>}</label>
          {hasImages ? (
            <div className="sh-image-grid">
              {block.options.map((opt) => (
                <button
                  key={opt.text}
                  className={`sh-image-card${selected === opt.text ? ' sh-image-card--selected' : ''}`}
                  onClick={() => setValue(block.id!, opt.text)}
                >
                  {opt.image && <img src={opt.image} alt={opt.text} className="sh-image-card-img" />}
                  <span className="sh-image-card-label"><OptionIconText text={opt.text} /></span>
                </button>
              ))}
            </div>
          ) : (
            <div className="sh-radio-group">
              {block.options.map((opt) => (
                <label key={opt.text} className="sh-radio-item" onClick={() => setValue(block.id!, opt.text)}>
                  <div className={`sh-radio-circle${selected === opt.text ? ' sh-radio-circle--checked' : ''}`}>
                    {selected === opt.text && <div className="sh-radio-dot" />}
                  </div>
                  <span><OptionIconText text={opt.text} /></span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'multi-select': {
      const checked = (values[block.id!] as string[]) || [];
      const hasImages = block.options.some((o) => o.image);
      return (
        <div className="sh-field">
          <label className="sh-label"><IconText text={block.label} />{block.required && <span className="sh-required">*</span>}</label>
          {hasImages ? (
            <div className="sh-image-grid">
              {block.options.map((opt) => (
                <button
                  key={opt.text}
                  className={`sh-image-card sh-image-card--filter${checked.includes(opt.text) ? ' sh-image-card--selected' : ''}`}
                  onClick={() => {
                    const next = checked.includes(opt.text) ? checked.filter(s => s !== opt.text) : [...checked, opt.text];
                    setValue(block.id!, next);
                  }}
                >
                  {opt.image && <img src={opt.image} alt={opt.text} className="sh-image-card-img" />}
                  <span className="sh-image-card-label">
                    {checked.includes(opt.text) && <span className="sh-check-icon">&#10003; </span>}
                    <OptionIconText text={opt.text} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="sh-checkbox-group">
              {block.options.map((opt) => (
                <label key={opt.text} className="sh-checkbox-item" onClick={() => {
                  const next = checked.includes(opt.text) ? checked.filter(s => s !== opt.text) : [...checked, opt.text];
                  setValue(block.id!, next);
                }}>
                  <div className={`sh-checkbox-box${checked.includes(opt.text) ? ' sh-checkbox-box--checked' : ''}`}>
                    {checked.includes(opt.text) && <span className="sh-check-icon">&#10003;</span>}
                  </div>
                  <span><OptionIconText text={opt.text} /></span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'sequence': {
      const items = (values[block.id!] as string[]) || block.items;
      return (
        <div className="sh-field">
          <label className="sh-label"><IconText text={block.label} /></label>
          <div className="sh-sequence">
            {items.map((item, i) => (
              <div key={item} className="sh-sequence-item">
                <span className="sh-sequence-num">{i + 1}</span>
                <span className="sh-sequence-text">{item}</span>
                <span className="sh-sequence-arrows">
                  <button disabled={i === 0} onClick={() => {
                    const next = [...items]; const [m] = next.splice(i, 1); next.splice(i - 1, 0, m); setValue(block.id!, next);
                  }}>&#8593;</button>
                  <button disabled={i === items.length - 1} onClick={() => {
                    const next = [...items]; const [m] = next.splice(i, 1); next.splice(i + 1, 0, m); setValue(block.id!, next);
                  }}>&#8595;</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'text-input':
      return (
        <div className="sh-field">
          <label className="sh-label">
            <IconText text={block.label} />
            {block.required && <span className="sh-required">*</span>}
          </label>
          {block.multiline ? (
            <textarea
              className="sh-textarea"
              placeholder={block.placeholder}
              value={values[block.id!] ?? block.prefill ?? ''}
              onChange={(e) => setValue(block.id!, e.target.value)}
              rows={3}
            />
          ) : (
            <input
              className="sh-input"
              type="text"
              placeholder={block.placeholder}
              value={values[block.id!] ?? block.prefill ?? ''}
              onChange={(e) => setValue(block.id!, e.target.value)}
            />
          )}
          {block.hint && <p className="sh-hint">{block.hint}</p>}
        </div>
      );

    case 'typed-input': {
      const typedType = block.format === 'number' ? 'text' : block.format;
      const typedInputMode = block.format === 'number' ? 'numeric' as const : undefined;
      return (
        <div className="sh-field">
          <label className="sh-label">
            <IconText text={block.label} />
            {block.required && <span className="sh-required">*</span>}
          </label>
          <input
            className="sh-input"
            type={typedType}
            inputMode={typedInputMode}
            placeholder={block.placeholder}
            value={values[block.id!] ?? block.prefill ?? ''}
            onChange={(e) => setValue(block.id!, e.target.value)}
          />
          {block.hint && <p className="sh-hint">{block.hint}</p>}
        </div>
      );
    }

    case 'slider': {
      const val = values[block.id!] ?? block.default;
      return (
        <div className="sh-field">
          <label className="sh-label"><IconText text={block.label} /></label>
          <input
            type="range"
            className="sh-slider"
            min={block.min}
            max={block.max}
            step={block.step || 1}
            value={val}
            onChange={(e) => setValue(block.id!, Number(e.target.value))}
          />
          <div className="sh-slider-value">{formatDisplayValue(val, (block as any).displayFormat)}</div>
          {block.hint && <p className="sh-hint">{block.hint}</p>}
        </div>
      );
    }

    case 'date':
    case 'time':
    case 'datetime': {
      const inputType = block.type === 'date' ? 'date' : block.type === 'time' ? 'time' : 'datetime-local';
      return (
        <div className="sh-field">
          <label className="sh-label"><IconText text={block.label} /></label>
          <input
            type={inputType}
            className="sh-input"
            value={values[block.id!] ?? (block.default !== 'NOW' ? block.default : '')}
            onChange={(e) => setValue(block.id!, e.target.value)}
          />
        </div>
      );
    }

    case 'confirmation': {
      const confirmed = values[block.id!] === true;
      return (
        <div className="sh-field">
          <p className="sh-label"><IconText text={block.label} /></p>
          <div className="sh-btn-group">
            <button className={`sh-btn ${confirmed ? 'sh-btn--outline' : 'sh-btn--primary'}`} onClick={() => setValue(block.id!, false)}><IconText text={block.noLabel} /></button>
            <button className={`sh-btn ${confirmed ? 'sh-btn--primary' : 'sh-btn--outline'}`} onClick={() => { setValue(block.id!, true); onSubmit?.(); }}><IconText text={block.yesLabel} /></button>
          </div>
        </div>
      );
    }

    case 'file-upload':
    case 'image-upload':
      return (
        <div className="sh-field">
          <label className="sh-label"><IconText text={block.label} /></label>
          <div className="sh-upload">
            <span>{block.type === 'image-upload' ? '📷 ' : '📄 '}Click to upload</span>
          </div>
        </div>
      );

    case 'group':
      return (
        <div className="sh-group">
          {block.children.map((child, i) => (
            <ShadcnBlock key={i} block={child} values={values} setValue={setValue} onSubmit={onSubmit} />
          ))}
        </div>
      );

    default:
      return null;
  }
}

function countConfirmations(blocks: Block[]): number {
  let count = 0;
  for (const b of blocks) {
    if (b.type === 'confirmation') count++;
    if (b.type === 'group') count += countConfirmations(b.children);
  }
  return count;
}

function initValues(blocks: Block[]): Values {
  const v: Values = {};
  for (const b of blocks) {
    const a = b as any;
    if (b.type === 'group') Object.assign(v, initValues(b.children));
    else if (b.type === 'single-select') v[a.id] = a.options.find((o: any) => o.default)?.text ?? a.options[0]?.text;
    else if (b.type === 'multi-select') v[a.id] = a.options.filter((o: any) => o.selected).map((o: any) => o.text);
    else if (b.type === 'sequence') v[a.id] = [...a.items];
    else if (b.type === 'confirmation') v[a.id] = false;
    else if (b.type === 'slider') v[a.id] = a.default;
    else if (b.type === 'text-input') v[a.id] = a.prefill ?? '';
    else if (b.type === 'typed-input') v[a.id] = a.prefill ?? '';
  }
  return v;
}

export function ShadcnRenderer({ ast, onSubmit }: RendererProps) {
  const [values, setValues] = useState(() => initValues(ast.blocks));
  const setValue = useCallback((id: string, v: any) => setValues((prev) => ({ ...prev, [id]: v })), []);
  const [attempted, setAttempted] = useState(false);
  const errors = useMemo(() => validateForm(ast, values), [ast, values]);
  const canSubmit = Object.keys(errors).length === 0;
  const hideSubmit = countConfirmations(ast.blocks) === 1;

  const handleSubmit = useCallback(() => {
    setAttempted(true);
    if (canSubmit) onSubmit?.(serializeValues(ast, values));
  }, [canSubmit, ast, values, onSubmit]);

  return (
    <div className="sh-form">
      {ast.blocks.map((block, i) => (
        <ShadcnBlock key={i} block={block} values={values} setValue={setValue} onSubmit={handleSubmit} />
      ))}
      {!hideSubmit && (
        <button
          className="sh-btn sh-btn--primary sh-submit"
          disabled={!canSubmit && attempted}
          style={!canSubmit && attempted ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          onClick={handleSubmit}
        >
          Submit
        </button>
      )}
    </div>
  );
}
