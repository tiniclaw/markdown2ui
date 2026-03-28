import { useRef } from 'react';
import { specExamples, iconExample, imageOptionExample } from '../data/examples';
import { ExampleCard } from '../components/ExampleCard';
import { LivePlayground } from '../components/LivePlayground';

export function PlaygroundPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const allExamples = [...specExamples, iconExample, imageOptionExample];

  return (
    <div className="pg-page">
      {/* Quick nav for examples */}
      <nav className="pg-example-nav">
        <div className="nav-inner">
          <button className="nav-btn nav-btn--active" onClick={() => scrollTo('playground')}>
            Playground
          </button>
          {allExamples.map((ex) => (
            <button key={ex.id} className="nav-btn" onClick={() => scrollTo(ex.id)}>
              {ex.title}
            </button>
          ))}
        </div>
      </nav>

      {/* Live Playground */}
      <section
        className="section"
        ref={(el) => { sectionRefs.current['playground'] = el; }}
      >
        <h2>Interactive Playground</h2>
        <p className="section-desc">
          Type markdown2ui markup on the left and see it rendered as interactive UI on the right.
          The normalizer is enabled — try typing common SLM mistakes like <code>*</code> instead
          of <code>-</code>, or <code>[v]</code> instead of <code>[x]</code>.
        </p>
        <LivePlayground />
      </section>

      {/* Spec Examples */}
      <section className="section">
        <h2>Specification Examples</h2>
        <p className="section-desc">
          Every block type from the markdown2ui v0.9 spec with live rendering.
          Switch renderers to see how different design systems handle the same markup.
        </p>
      </section>

      {allExamples.map((example) => (
        <section
          key={example.id}
          className="section"
          ref={(el) => { sectionRefs.current[example.id] = el; }}
        >
          <h2>{example.title}</h2>
          <p className="section-desc">{example.description}</p>
          <ExampleCard markup={example.markup} />
        </section>
      ))}
    </div>
  );
}
