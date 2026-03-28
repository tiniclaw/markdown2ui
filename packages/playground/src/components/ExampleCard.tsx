import { useState, useMemo } from 'react';
import { parse } from '@markdown2ui/parser';
import { RenderWithStyle, RENDERER_LABELS, type RendererType } from '../renderers';

interface ExampleCardProps {
  markup: string;
}

const RENDERERS: RendererType[] = ['plain', 'shadcn', 'mui', 'json-render'];

export function ExampleCard({ markup }: ExampleCardProps) {
  const [submission, setSubmission] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<RendererType>('plain');

  const ast = useMemo(() => parse(markup), [markup]);

  return (
    <div className="example-card">
      <div className="example-code">
        <div className="example-code-header">Markup</div>
        <pre>{markup}</pre>
      </div>
      <div className="example-preview">
        <div className="example-preview-header">
          <span>Preview</span>
          <div className="renderer-picker">
            {RENDERERS.map((r) => (
              <button
                key={r}
                className={`renderer-btn${renderer === r ? ' renderer-btn--active' : ''}`}
                onClick={() => { setRenderer(r); setSubmission(null); }}
              >
                {RENDERER_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <RenderWithStyle type={renderer} ast={ast} onSubmit={setSubmission} />
        {submission && (
          <div className="submission-output">
            <div className="submission-output-header">Submission</div>
            <pre>{submission}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
