import { useState, useMemo } from 'react';
import { parse } from '@markdown2ui/parser';
import { playgroundDefault } from '../data/examples';
import { RenderWithStyle, RENDERER_LABELS, type RendererType } from '../renderers';

const RENDERERS: RendererType[] = ['plain', 'shadcn', 'mui', 'json-render'];

export function LivePlayground() {
  const [markup, setMarkup] = useState(playgroundDefault);
  const [showAst, setShowAst] = useState(false);
  const [submission, setSubmission] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<RendererType>('plain');

  const ast = useMemo(() => {
    try {
      return parse(markup, { normalize: true });
    } catch {
      return null;
    }
  }, [markup]);

  return (
    <div>
      <div className="playground">
        <div className="playground-editor">
          <div className="playground-editor-header">
            <span>Editor</span>
            <button
              className="ast-toggle"
              onClick={() => setShowAst(!showAst)}
            >
              {showAst ? 'Hide AST' : 'Show AST'}
            </button>
          </div>
          <textarea
            className="playground-textarea"
            value={markup}
            onChange={(e) => {
              setMarkup(e.target.value);
              setSubmission(null);
            }}
            spellCheck={false}
          />
          {showAst && ast && (
            <div className="ast-viewer">
              <pre>{JSON.stringify(ast, null, 2)}</pre>
            </div>
          )}
        </div>
        <div className="playground-preview">
          <div className="playground-preview-header">
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
          <div className="playground-preview-content">
            {ast ? (
              <RenderWithStyle type={renderer} ast={ast} onSubmit={setSubmission} />
            ) : (
              <p style={{ color: 'var(--pg-text-secondary)', fontStyle: 'italic' }}>
                Invalid markup
              </p>
            )}
          </div>
        </div>
      </div>

      {submission && (
        <div className="submission-output">
          <div className="submission-output-header">Submission Output</div>
          <pre>{submission}</pre>
        </div>
      )}
    </div>
  );
}
