/**
 * json-render (SDUI) renderer.
 * Converts AST → flat Spec, then renders UI from that Spec.
 * Shows toggleable JSON alongside the live rendered output.
 */

import { useState, useMemo, useCallback } from 'react';
import type { AST, Block } from '@markdown2ui/parser';
import type { RendererProps } from './types';
import { serializeValues } from './serialize';
import { formatDisplayValue } from './formatValue';
import { IconText } from './IconText';
import { processIconTextSimple } from './icons';

interface UIElement {
  type: string;
  props: Record<string, unknown>;
  children?: string[];
}

interface Spec {
  root: string;
  elements: Record<string, UIElement>;
}

let counter = 0;
function genKey(prefix: string): string {
  return `${prefix}-${++counter}`;
}

function convertBlock(block: Block, elements: Record<string, UIElement>): string {
  const b = block as any;

  switch (block.type) {
    case 'header': {
      const key = genKey('heading');
      elements[key] = { type: 'Heading', props: { text: block.text, level: block.level === 1 ? 'h2' : 'h3' }, children: [] };
      return key;
    }
    case 'prose': {
      const key = genKey('text');
      elements[key] = { type: 'Text', props: { text: block.text, variant: 'body' }, children: [] };
      return key;
    }
    case 'divider': {
      const key = genKey('separator');
      elements[key] = { type: 'Separator', props: {}, children: [] };
      return key;
    }
    case 'single-select': {
      const key = genKey('select');
      const defaultOpt = b.options.find((o: any) => o.default);
      const hasImages = b.options.some((o: any) => o.image);
      elements[key] = {
        type: hasImages ? 'ImageSelect' : 'Select',
        props: {
          label: b.label, name: b.id,
          options: b.options.map((o: any) => hasImages ? { text: o.text, image: o.image } : o.text),
          value: defaultOpt?.text,
        },
        children: [],
      };
      return key;
    }
    case 'multi-select': {
      const groupKey = genKey('checkboxgroup');
      const hasImages = b.options.some((o: any) => o.image);
      elements[groupKey] = {
        type: hasImages ? 'ImageCheckboxGroup' : 'CheckboxGroup',
        props: {
          label: b.label, name: b.id,
          options: b.options.map((o: any) => hasImages
            ? { text: o.text, checked: o.selected, image: o.image }
            : { text: o.text, checked: o.selected }),
        },
        children: [],
      };
      return groupKey;
    }
    case 'sequence': {
      const key = genKey('sequence');
      elements[key] = { type: 'Sequence', props: { label: b.label, name: b.id, items: [...b.items] }, children: [] };
      return key;
    }
    case 'confirmation': {
      const key = genKey('confirm');
      elements[key] = { type: 'Confirmation', props: { label: b.label, yesLabel: b.yesLabel, noLabel: b.noLabel, name: b.id }, children: [] };
      return key;
    }
    case 'text-input': {
      const key = genKey(b.multiline ? 'textarea' : 'input');
      elements[key] = {
        type: b.multiline ? 'Textarea' : 'Input',
        props: { label: b.label, name: b.id, placeholder: b.placeholder ?? '', value: b.prefill ?? '', required: !!b.required },
        children: [],
      };
      return key;
    }
    case 'typed-input': {
      const key = genKey('input');
      elements[key] = {
        type: 'Input',
        props: { label: b.label, name: b.id, inputType: b.format, placeholder: b.placeholder ?? '', value: b.prefill ?? '', required: !!b.required },
        children: [],
      };
      return key;
    }
    case 'slider': {
      const key = genKey('slider');
      elements[key] = { type: 'Slider', props: { label: b.label, name: b.id, min: b.min, max: b.max, step: b.step ?? 1, value: b.default, ...(b.displayFormat ? { displayFormat: b.displayFormat } : {}) }, children: [] };
      return key;
    }
    case 'date': case 'time': case 'datetime': {
      const key = genKey('dateinput');
      const inputType = block.type === 'date' ? 'date' : block.type === 'time' ? 'time' : 'datetime-local';
      elements[key] = { type: 'Input', props: { label: b.label, name: b.id, inputType, value: b.default !== 'NOW' ? b.default : '' }, children: [] };
      return key;
    }
    case 'file-upload': case 'image-upload': {
      const key = genKey('upload');
      elements[key] = { type: 'Button', props: { label: `Upload: ${b.label}`, variant: 'outline', name: b.id }, children: [] };
      return key;
    }
    case 'group': {
      const groupKey = genKey('grid');
      const childKeys = b.children.map((child: Block) => convertBlock(child, elements));
      elements[groupKey] = { type: 'Grid', props: { columns: 2 }, children: childKeys };
      return groupKey;
    }
    default: {
      const key = genKey('text');
      elements[key] = { type: 'Text', props: { text: '(unsupported)' }, children: [] };
      return key;
    }
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

function astToSpec(ast: AST): Spec {
  counter = 0;
  const elements: Record<string, UIElement> = {};
  const childKeys = ast.blocks.map((b) => convertBlock(b, elements));

  if (countConfirmations(ast.blocks) !== 1) {
    const submitKey = genKey('button');
    elements[submitKey] = { type: 'Button', props: { label: 'Submit', variant: 'primary' }, children: [] };
    childKeys.push(submitKey);
  }

  const rootKey = genKey('root');
  elements[rootKey] = { type: 'Stack', props: { direction: 'vertical' }, children: childKeys };

  return { root: rootKey, elements };
}

// ─── Mini renderer that walks the Spec and renders React ──────

type State = Record<string, any>;

function ElementRenderer({ id, spec, state, setState, onSubmit }: {
  id: string; spec: Spec; state: State; setState: (id: string, v: any) => void; onSubmit?: () => void;
}) {
  const el = spec.elements[id];
  if (!el) return null;
  const p = el.props as any;
  const children = el.children?.map((cid) => (
    <ElementRenderer key={cid} id={cid} spec={spec} state={state} setState={setState} onSubmit={onSubmit} />
  ));

  switch (el.type) {
    case 'Stack':
      return <div className="jr-stack" style={{ flexDirection: p.direction === 'horizontal' ? 'row' : 'column' }}>{children}</div>;
    case 'Grid':
      return <div className="jr-grid">{children}</div>;
    case 'Heading':
      return p.level === 'h2' ? <h2 className="jr-heading"><IconText text={p.text} /></h2> : <h3 className="jr-subheading"><IconText text={p.text} /></h3>;
    case 'Text':
      return <p className={`jr-text ${p.variant === 'label' ? 'jr-text--label' : ''}`}><IconText text={p.text} /></p>;
    case 'Separator':
      return <hr className="jr-separator" />;
    case 'Input':
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} />{p.required && <span className="jr-req"> *</span>}</label>
          <input className="jr-input" type={p.inputType || 'text'} placeholder={p.placeholder}
            value={state[p.name] ?? p.value ?? ''} onChange={(e) => setState(p.name, e.target.value)} />
        </div>
      );
    case 'Textarea':
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} />{p.required && <span className="jr-req"> *</span>}</label>
          <textarea className="jr-textarea" placeholder={p.placeholder} rows={3}
            value={state[p.name] ?? p.value ?? ''} onChange={(e) => setState(p.name, e.target.value)} />
        </div>
      );
    case 'Select': {
      const val = state[p.name] ?? p.value;
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} /></label>
          <select className="jr-select" value={val} onChange={(e) => setState(p.name, e.target.value)}>
            {(p.options as string[]).map((o: string) => <option key={o} value={o}>{processIconTextSimple(o)}</option>)}
          </select>
        </div>
      );
    }
    case 'ImageSelect': {
      const val = state[p.name] ?? p.value;
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} /></label>
          <div className="jr-image-grid">
            {(p.options as any[]).map((o: any) => (
              <button key={o.text} className={`jr-image-card${val === o.text ? ' jr-image-card--selected' : ''}`}
                onClick={() => setState(p.name, o.text)}>
                {o.image && <img src={o.image} alt={o.text} className="jr-image-card-img" />}
                <span className="jr-image-card-label"><IconText text={o.text} /></span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    case 'ImageCheckboxGroup': {
      const checked: string[] = state[p.name] ?? (p.options as any[]).filter((o: any) => o.checked).map((o: any) => o.text);
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} /></label>
          <div className="jr-image-grid">
            {(p.options as any[]).map((o: any) => (
              <button key={o.text} className={`jr-image-card${checked.includes(o.text) ? ' jr-image-card--selected' : ''}`}
                onClick={() => {
                  const next = checked.includes(o.text) ? checked.filter((s: string) => s !== o.text) : [...checked, o.text];
                  setState(p.name, next);
                }}>
                {o.image && <img src={o.image} alt={o.text} className="jr-image-card-img" />}
                <span className="jr-image-card-label">
                  {checked.includes(o.text) && <span>&#10003; </span>}
                  <IconText text={o.text} />
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    case 'CheckboxGroup': {
      const checked: string[] = state[p.name] ?? (p.options as any[]).filter((o: any) => o.checked).map((o: any) => o.text);
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} /></label>
          {(p.options as any[]).map((o: any) => (
            <label key={o.text} className="jr-checkbox-row">
              <input type="checkbox" checked={checked.includes(o.text)} onChange={() => {
                const next = checked.includes(o.text) ? checked.filter((s: string) => s !== o.text) : [...checked, o.text];
                setState(p.name, next);
              }} />
              <span><IconText text={o.text} /></span>
            </label>
          ))}
        </div>
      );
    }
    case 'Slider': {
      const val = state[p.name] ?? p.value;
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} /></label>
          <input type="range" className="jr-slider-input" min={p.min} max={p.max} step={p.step} value={val}
            onChange={(e) => setState(p.name, Number(e.target.value))} />
          <span className="jr-slider-val">{formatDisplayValue(val, p.displayFormat)}</span>
        </div>
      );
    }
    case 'Sequence': {
      const items: string[] = state[p.name] ?? [...(p.items as string[])];
      return (
        <div className="jr-field">
          <label className="jr-field-label"><IconText text={p.label} /></label>
          {items.map((item: string, i: number) => (
            <div key={item} className="jr-seq-item">
              <span className="jr-seq-num">{i + 1}.</span>
              <span className="jr-seq-text">{item}</span>
              <button disabled={i === 0} onClick={() => { const n = [...items]; const [m] = n.splice(i, 1); n.splice(i - 1, 0, m); setState(p.name, n); }}>&#8593;</button>
              <button disabled={i === items.length - 1} onClick={() => { const n = [...items]; const [m] = n.splice(i, 1); n.splice(i + 1, 0, m); setState(p.name, n); }}>&#8595;</button>
            </div>
          ))}
        </div>
      );
    }
    case 'Confirmation':
      return (
        <div className="jr-field">
          <p className="jr-field-label"><IconText text={p.label} /></p>
          <div className="jr-btn-row">
            <button className="jr-btn jr-btn--outline" onClick={() => setState(p.name, false)}><IconText text={p.noLabel} /></button>
            <button className="jr-btn jr-btn--default" onClick={() => setState(p.name, true)}><IconText text={p.yesLabel} /></button>
          </div>
        </div>
      );
    case 'Button':
      if (p.variant === 'primary') {
        return <button className="jr-btn jr-btn--primary" onClick={onSubmit}><IconText text={p.label} /></button>;
      }
      return <button className="jr-btn jr-btn--outline"><IconText text={p.label} /></button>;
    default:
      return <div className="jr-unknown">[{el.type}]</div>;
  }
}

export function JsonRenderRenderer({ ast, onSubmit }: RendererProps) {
  const [showSpec, setShowSpec] = useState(false);
  const spec = useMemo(() => astToSpec(ast), [ast]);
  const [state, setFullState] = useState<State>({});
  const setState = useCallback((id: string, v: any) => setFullState((prev) => ({ ...prev, [id]: v })), []);

  return (
    <div className="jr-container">
      <div className="jr-header">
        <span className="jr-badge">json-render (SDUI)</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="jr-toggle" onClick={() => setShowSpec(!showSpec)}>
            {showSpec ? 'Hide Spec' : 'Show Spec'}
          </button>
          <span className="jr-stats-inline">{Object.keys(spec.elements).length} elements</span>
        </div>
      </div>

      {showSpec && (
        <pre className="jr-spec">{JSON.stringify(spec, null, 2)}</pre>
      )}

      <div className="jr-rendered">
        <ElementRenderer
          id={spec.root}
          spec={spec}
          state={state}
          setState={setState}
          onSubmit={() => onSubmit?.(serializeValues(ast, state))}
        />
      </div>
    </div>
  );
}
