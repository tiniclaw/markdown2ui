/**
 * Material UI-style renderer.
 * Uses plain HTML + CSS that mimics Material Design 3 aesthetic.
 * No actual MUI dependency — just the visual style.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Block } from '@markdown2ui/parser';
import type { RendererProps } from './types';
import { serializeValues } from './serialize';
import { formatDisplayValue } from './formatValue';
import { IconText } from './IconText';
import { validateForm } from './validate';

type Values = Record<string, any>;

function MuiBlock({ block, values, setValue, onSubmit }: { block: Block; values: Values; setValue: (id: string, v: any) => void; onSubmit?: () => void }) {
  switch (block.type) {
    case 'header':
      return block.level === 1
        ? <h2 className="mui-h1"><IconText text={block.text} /></h2>
        : <h3 className="mui-h2"><IconText text={block.text} /></h3>;

    case 'prose':
      return <p className="mui-prose"><IconText text={block.text} /></p>;

    case 'divider':
      return <hr className="mui-divider" />;

    case 'single-select': {
      const selected = values[block.id!] as string;
      const hasImages = block.options.some((o) => o.image);
      return (
        <div className="mui-field">
          <label className="mui-label"><IconText text={block.label} />{block.required && <span className="mui-required"> *</span>}</label>
          <div className={hasImages ? 'mui-image-grid' : 'mui-chip-group'}>
            {block.options.map((opt) =>
              hasImages ? (
                <button
                  key={opt.text}
                  className={`mui-image-card${selected === opt.text ? ' mui-image-card--selected' : ''}`}
                  onClick={() => setValue(block.id!, opt.text)}
                >
                  {opt.image && <img src={opt.image} alt={opt.text} className="mui-image-card-img" />}
                  <span className="mui-image-card-label"><IconText text={opt.text} /></span>
                </button>
              ) : (
                <button
                  key={opt.text}
                  className={`mui-chip${selected === opt.text ? ' mui-chip--selected' : ''}`}
                  onClick={() => setValue(block.id!, opt.text)}
                >
                  <IconText text={opt.text} />
                </button>
              )
            )}
          </div>
          {block.hint && <p className="mui-hint">{block.hint}</p>}
        </div>
      );
    }

    case 'multi-select': {
      const checked = (values[block.id!] as string[]) || [];
      const hasImages = block.options.some((o) => o.image);
      return (
        <div className="mui-field">
          <label className="mui-label"><IconText text={block.label} />{block.required && <span className="mui-required"> *</span>}</label>
          <div className={hasImages ? 'mui-image-grid' : 'mui-chip-group'}>
            {block.options.map((opt) =>
              hasImages ? (
                <button
                  key={opt.text}
                  className={`mui-image-card mui-image-card--filter${checked.includes(opt.text) ? ' mui-image-card--selected' : ''}`}
                  onClick={() => {
                    const next = checked.includes(opt.text) ? checked.filter(s => s !== opt.text) : [...checked, opt.text];
                    setValue(block.id!, next);
                  }}
                >
                  {opt.image && <img src={opt.image} alt={opt.text} className="mui-image-card-img" />}
                  <span className="mui-image-card-label">
                    {checked.includes(opt.text) && <span className="mui-chip-check">&#10003; </span>}
                    <IconText text={opt.text} />
                  </span>
                </button>
              ) : (
                <button
                  key={opt.text}
                  className={`mui-chip mui-chip--filter${checked.includes(opt.text) ? ' mui-chip--selected' : ''}`}
                  onClick={() => {
                    const next = checked.includes(opt.text) ? checked.filter(s => s !== opt.text) : [...checked, opt.text];
                    setValue(block.id!, next);
                  }}
                >
                  {checked.includes(opt.text) && <span className="mui-chip-check">&#10003; </span>}
                  <IconText text={opt.text} />
                </button>
              )
            )}
          </div>
        </div>
      );
    }

    case 'sequence': {
      const items = (values[block.id!] as string[]) || block.items;
      return (
        <div className="mui-field">
          <label className="mui-label"><IconText text={block.label} /></label>
          <div className="mui-list">
            {items.map((item, i) => (
              <div key={item} className="mui-list-item">
                <span className="mui-list-drag">&#8942;&#8942;</span>
                <span className="mui-list-text">{item}</span>
                <div className="mui-list-actions">
                  <button className="mui-icon-btn" disabled={i === 0} onClick={() => {
                    const next = [...items]; const [m] = next.splice(i, 1); next.splice(i - 1, 0, m); setValue(block.id!, next);
                  }}>&#9650;</button>
                  <button className="mui-icon-btn" disabled={i === items.length - 1} onClick={() => {
                    const next = [...items]; const [m] = next.splice(i, 1); next.splice(i + 1, 0, m); setValue(block.id!, next);
                  }}>&#9660;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'text-input':
      return (
        <div className="mui-field">
          <div className="mui-outlined-input">
            {block.multiline ? (
              <textarea
                className="mui-input-element"
                placeholder=" "
                value={values[block.id!] ?? block.prefill ?? ''}
                onChange={(e) => setValue(block.id!, e.target.value)}
                rows={3}
              />
            ) : (
              <input
                type="text"
                className="mui-input-element"
                placeholder=" "
                value={values[block.id!] ?? block.prefill ?? ''}
                onChange={(e) => setValue(block.id!, e.target.value)}
              />
            )}
            <label className="mui-floating-label">
              <IconText text={block.label} />
              {block.required && <span className="mui-required"> *</span>}
            </label>
          </div>
          {block.hint && <p className="mui-hint">{block.hint}</p>}
        </div>
      );

    case 'typed-input': {
      const muiType = block.format === 'number' ? 'text' : block.format;
      const muiInputMode = block.format === 'number' ? 'numeric' as const : undefined;
      return (
        <div className="mui-field">
          <div className="mui-outlined-input">
            <input
              type={muiType}
              inputMode={muiInputMode}
              className="mui-input-element"
              placeholder=" "
              value={values[block.id!] ?? block.prefill ?? ''}
              onChange={(e) => setValue(block.id!, e.target.value)}
            />
            <label className="mui-floating-label">
              <IconText text={block.label} />
              {block.required && <span className="mui-required"> *</span>}
            </label>
          </div>
          {block.hint && <p className="mui-hint">{block.hint}</p>}
        </div>
      );
    }

    case 'slider': {
      const val = values[block.id!] ?? block.default;
      return (
        <div className="mui-field">
          <label className="mui-label"><IconText text={block.label} /></label>
          <div className="mui-slider-container">
            <span className="mui-slider-label">{block.min}</span>
            <input
              type="range"
              className="mui-slider"
              min={block.min}
              max={block.max}
              step={block.step || 1}
              value={val}
              onChange={(e) => setValue(block.id!, Number(e.target.value))}
            />
            <span className="mui-slider-label">{block.max}</span>
          </div>
          <div className="mui-slider-value">{formatDisplayValue(val, (block as any).displayFormat)}</div>
          {block.hint && <p className="mui-hint">{block.hint}</p>}
        </div>
      );
    }

    case 'date':
    case 'time':
    case 'datetime': {
      const inputType = block.type === 'date' ? 'date' : block.type === 'time' ? 'time' : 'datetime-local';
      return (
        <div className="mui-field">
          <div className="mui-outlined-input">
            <input
              type={inputType}
              className="mui-input-element"
              placeholder=" "
              value={values[block.id!] ?? (block.default !== 'NOW' ? block.default : '')}
              onChange={(e) => setValue(block.id!, e.target.value)}
            />
            <label className="mui-floating-label"><IconText text={block.label} /></label>
          </div>
        </div>
      );
    }

    case 'confirmation': {
      const muiConfirmed = values[block.id!] === true;
      return (
        <div className="mui-field">
          <p className="mui-label"><IconText text={block.label} /></p>
          <div className="mui-btn-group">
            <button className={`mui-btn ${muiConfirmed ? 'mui-btn--outlined' : 'mui-btn--filled'}`} onClick={() => setValue(block.id!, false)}><IconText text={block.noLabel} /></button>
            <button className={`mui-btn ${muiConfirmed ? 'mui-btn--filled' : 'mui-btn--outlined'}`} onClick={() => { setValue(block.id!, true); onSubmit?.(); }}><IconText text={block.yesLabel} /></button>
          </div>
        </div>
      );
    }

    case 'file-upload':
    case 'image-upload':
      return (
        <div className="mui-field">
          <label className="mui-label"><IconText text={block.label} /></label>
          <button className="mui-btn mui-btn--tonal">
            {block.type === 'image-upload' ? '📷 Upload image' : '📎 Upload file'}
          </button>
        </div>
      );

    case 'group':
      return (
        <div className="mui-group">
          {block.children.map((child, i) => (
            <MuiBlock key={i} block={child} values={values} setValue={setValue} onSubmit={onSubmit} />
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

export function MuiRenderer({ ast, onSubmit }: RendererProps) {
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
    <div className="mui-form">
      {ast.blocks.map((block, i) => (
        <MuiBlock key={i} block={block} values={values} setValue={setValue} onSubmit={handleSubmit} />
      ))}
      {!hideSubmit && (
        <button
          className="mui-btn mui-btn--filled mui-submit"
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
