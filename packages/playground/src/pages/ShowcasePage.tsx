import { useState, useMemo } from 'react';
import { parse } from '@markdown2ui/parser';
import { RenderWithStyle, type RendererType } from '../renderers';

const heroExample = `> name: What's your name? | John Doe

Favorite framework
- React (default)
- SwiftUI
- Compose

~ satisfaction: Satisfaction [1 - 10] (8)

?! Ready to submit?`;

const stepExamples = [
  {
    label: 'Single-select',
    markup: `Preferred language
- TypeScript
- Python (default)
- Rust
- Go`,
  },
  {
    label: 'Multi-select',
    markup: `Features needed
- [x] Authentication
- [x] Dark mode
- [ ] Offline support
- [ ] Analytics`,
  },
  {
    label: 'Text input',
    markup: `> project: Project name | e.g., MyApp
>>! description: Description | What does it do?`,
  },
  {
    label: 'Typed inputs',
    markup: `@email contact: Email | you@example.com
@url website: Website | https://
@number! seats: Number of seats`,
  },
  {
    label: 'Slider + Format',
    markup: `~ price: Budget [100 - 10000] (2500) %500 @currency(USD)
~ rating: Rating [1 - 5] (4) @unit(star|stars)
~ progress: Completion [0 - 100] (65) @percent`,
  },
  {
    label: 'Date & Time',
    markup: `{ schedule
@date start: Start date
@time meeting: Meeting time | 14:00
}
@datetime deadline: Deadline`,
  },
  {
    label: 'Uploads',
    markup: `[report: Upload report](.pdf, .docx)
![avatar: Profile photo]()`,
  },
  {
    label: 'Confirmation',
    markup: `?! confirm: Are you sure you want to proceed? ? Yes, continue : No, go back`,
  },
  {
    label: 'Sequence',
    markup: `priority: Arrange by priority
1. Performance
2. Security
3. Usability
4. Cost`,
  },
  {
    label: 'Full form',
    markup: `# Project Setup

{ info
>! name: Project name
> team: Team name | e.g., Platform
}

Type
- Web app (default)
- Mobile app
- CLI tool
- Library

Features
- [x] CI/CD pipeline
- [ ] Docker setup
- [ ] Monitoring

~ timeline: Timeline (weeks) [1 - 52] (4) @unit(week|weeks)

?! create: Create project?`,
  },
];

const imageOptionExample = `destination: Where to?
- ![](https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop) Paris
- ![](https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop) Tokyo (default)
- ![](https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=400&h=300&fit=crop) New York`;

export function ShowcasePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="showcase">
      <HeroSection onNavigate={onNavigate} />
      <HowItWorksSection />
      <LiveDemoSection />
      <ComponentGallery />
      <ImageOptionsSection />
      <CrossPlatformSection />
      <WhySection />
      <QuickStartSection />
      <CommunitySection onNavigate={onNavigate} />
    </div>
  );
}

function HeroSection({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <header className="sc-hero">
      <div className="sc-hero-content">
        <h1 className="sc-hero-title">
          <span className="sc-hero-accent">markdown2ui</span>
        </h1>
        <p className="sc-hero-subtitle">
          Plain text in. Native UI out.
        </p>
        <p className="sc-hero-desc">
          A lightweight markup that lets AI agents generate interactive forms
          without writing UI code. The LLM writes simple text &mdash; the client renders
          native components on any platform.
        </p>
        <div className="sc-hero-badges">
          <span className="badge">v0.9</span>
          <span className="badge">Web + iOS + Android</span>
          <span className="badge">Apache 2.0</span>
        </div>
        <div className="sc-hero-actions">
          <button className="sc-btn sc-btn-primary" onClick={() => onNavigate('playground')}>
            Try the Playground
          </button>
          <button className="sc-btn sc-btn-secondary" onClick={() => onNavigate('docs')}>
            Learn More
          </button>
          <a
            className="sc-btn sc-btn-ghost"
            href="https://github.com/tiniclaw/markdown2ui"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

function HowItWorksSection() {
  return (
    <section className="sc-section">
      <h2 className="sc-section-title">How it works</h2>
      <p className="sc-section-desc">
        The LLM writes lightweight markup. The parser converts it to an AST. The renderer builds native UI.
      </p>
      <div className="sc-steps">
        <div className="sc-step">
          <div className="sc-step-number">1</div>
          <h3>LLM writes markup</h3>
          <pre className="sc-step-code">{`Preferred language
- TypeScript
- Python (default)
- Rust`}</pre>
          <p>Plain text. Barely more than a bulleted list.</p>
        </div>
        <div className="sc-step-arrow">&#8594;</div>
        <div className="sc-step">
          <div className="sc-step-number">2</div>
          <h3>Parser builds AST</h3>
          <pre className="sc-step-code">{`{
  "type": "single-select",
  "id": "preferred_language",
  "label": "Preferred language",
  "options": [
    { "label": "TypeScript" },
    { "label": "Python",
      "isDefault": true },
    { "label": "Rust" }
  ]
}`}</pre>
          <p>Structured JSON. Platform-agnostic.</p>
        </div>
        <div className="sc-step-arrow">&#8594;</div>
        <div className="sc-step">
          <div className="sc-step-number">3</div>
          <h3>Client renders UI</h3>
          <div className="sc-step-render">
            <MiniRender markup={`Preferred language\n- TypeScript\n- Python (default)\n- Rust`} />
          </div>
          <p>Native components. Web, iOS, Android.</p>
        </div>
      </div>
    </section>
  );
}

function MiniRender({ markup }: { markup: string }) {
  const ast = useMemo(() => {
    try { return parse(markup); } catch { return null; }
  }, [markup]);
  if (!ast) return null;
  return <RenderWithStyle type="plain" ast={ast} onSubmit={() => {}} />;
}

function LiveDemoSection() {
  const [renderer, setRenderer] = useState<RendererType>('plain');
  const ast = useMemo(() => {
    try { return parse(heroExample, { normalize: true }); } catch { return null; }
  }, []);
  const renderers: RendererType[] = ['plain', 'shadcn', 'mui'];

  return (
    <section className="sc-section sc-section-alt">
      <h2 className="sc-section-title">See it in action</h2>
      <p className="sc-section-desc">
        One markup, multiple renderers. Switch between design systems &mdash; the markup stays the same.
      </p>
      <div className="sc-demo">
        <div className="sc-demo-code">
          <div className="sc-demo-header">Markup</div>
          <pre>{heroExample}</pre>
        </div>
        <div className="sc-demo-preview">
          <div className="sc-demo-header">
            <span>Rendered UI</span>
            <div className="renderer-picker">
              {renderers.map((r) => (
                <button
                  key={r}
                  className={`renderer-btn${renderer === r ? ' renderer-btn--active' : ''}`}
                  onClick={() => setRenderer(r)}
                >
                  {r === 'plain' ? 'Default' : r === 'shadcn' ? 'shadcn/ui' : 'Material'}
                </button>
              ))}
            </div>
          </div>
          <div className="sc-demo-content">
            {ast && <RenderWithStyle type={renderer} ast={ast} onSubmit={() => {}} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentGallery() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = stepExamples[activeIdx];
  const ast = useMemo(() => {
    try { return parse(active.markup); } catch { return null; }
  }, [active.markup]);

  return (
    <section className="sc-section">
      <h2 className="sc-section-title">Every component you need</h2>
      <p className="sc-section-desc">
        Selects, text inputs, sliders, date pickers, file uploads, confirmations, reorderable lists
        &mdash; all from simple one-line prefixes.
      </p>
      <div className="sc-gallery">
        <div className="sc-gallery-tabs">
          {stepExamples.map((ex, i) => (
            <button
              key={i}
              className={`sc-gallery-tab${i === activeIdx ? ' sc-gallery-tab--active' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <div className="sc-gallery-content">
          <div className="sc-gallery-code">
            <pre>{active.markup}</pre>
          </div>
          <div className="sc-gallery-preview">
            {ast && <RenderWithStyle type="plain" ast={ast} onSubmit={() => {}} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function ImageOptionsSection() {
  const ast = useMemo(() => {
    try { return parse(imageOptionExample); } catch { return null; }
  }, []);

  return (
    <section className="sc-section sc-section-alt">
      <h2 className="sc-section-title">Image options</h2>
      <p className="sc-section-desc">
        Attach thumbnail images to select options for rich, card-based layouts.
        Just use standard markdown image syntax at the start of each option.
      </p>
      <div className="sc-demo">
        <div className="sc-demo-code">
          <div className="sc-demo-header">Markup</div>
          <pre>{imageOptionExample}</pre>
        </div>
        <div className="sc-demo-preview">
          <div className="sc-demo-header">Rendered UI</div>
          <div className="sc-demo-content">
            {ast && <RenderWithStyle type="plain" ast={ast} onSubmit={() => {}} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function CrossPlatformSection() {
  return (
    <section className="sc-section">
      <h2 className="sc-section-title">One markup. Every platform.</h2>
      <p className="sc-section-desc">
        The same markup renders with native components on each platform.
        No webviews. No HTML on mobile. Each renderer uses its platform&rsquo;s toolkit.
      </p>
      <div className="sc-platforms">
        <div className="sc-platform">
          <div className="sc-platform-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 0 1-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9c-.6 0-1.17 0-1.71.03-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03.6 0 1.17 0 1.71-.03.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68 0 1.69-1.83 2.93-4.37 3.68.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68 0-1.69 1.83-2.93 4.37-3.68-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26 0-.73-1.18-1.63-3.28-2.26-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26 0 .73 1.18 1.63 3.28 2.26.25-.76.55-1.51.89-2.26m9 2.26-.3.51c.31-.05.61-.1.88-.16-.07-.28-.18-.57-.29-.86l-.29.51m-2.89 4.04c1.59 1.5 2.97 2.08 3.59 1.7.64-.35.83-1.82.32-3.96-.77.16-1.58.28-2.4.36-.48.67-.99 1.31-1.51 1.9M8.08 9.74l.3-.51c-.31.05-.61.1-.88.16.07.28.18.57.29.86l.29-.51m2.89-4.04C9.38 4.2 8 3.62 7.37 4c-.63.35-.82 1.82-.31 3.96a22.7 22.7 0 0 0 2.4-.36c.48-.67.99-1.31 1.51-1.9z"/></svg>
          </div>
          <h3>React</h3>
          <p>Web &amp; React Native</p>
        </div>
        <div className="sc-platform">
          <div className="sc-platform-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          </div>
          <h3>SwiftUI</h3>
          <p>iOS &amp; macOS</p>
        </div>
        <div className="sc-platform">
          <div className="sc-platform-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M16.61 15.15c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .84.37.84.83s-.38.83-.84.83m-9.22 0c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .84.37.84.83s-.38.83-.84.83m9.5-5.29 1.67-2.88c.09-.17.04-.38-.13-.47-.17-.1-.38-.04-.47.12L16.28 9.6c-1.26-.58-2.69-.9-4.28-.9s-3.02.32-4.28.9L6.04 6.63c-.09-.16-.3-.22-.47-.12-.17.09-.22.3-.13.47l1.67 2.88C3.89 11.65 1.69 14.73 1.5 18.18h21c-.19-3.45-2.39-6.53-5.61-8.32z"/></svg>
          </div>
          <h3>Compose</h3>
          <p>Android</p>
        </div>
        <div className="sc-platform">
          <div className="sc-platform-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <h3>Your platform</h3>
          <p>Implement a renderer</p>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="sc-section sc-section-alt">
      <h2 className="sc-section-title">Why markdown2ui?</h2>
      <div className="sc-why-grid">
        <div className="sc-why-card">
          <h3>Zero reasoning overhead</h3>
          <p>
            The markup is barely more complex than a bulleted list. LLMs generate it
            with minimal token cost, keeping their reasoning capacity for what matters.
          </p>
        </div>
        <div className="sc-why-card">
          <h3>Platform-agnostic</h3>
          <p>
            Same markup renders natively on Web, iOS, and Android.
            No webviews on mobile. Each platform uses its own UI toolkit.
          </p>
        </div>
        <div className="sc-why-card">
          <h3>Language-agnostic</h3>
          <p>
            The spec is just text. The reference parser is TypeScript, but you can
            implement a parser in Python, Go, Rust, or any language.
          </p>
        </div>
        <div className="sc-why-card">
          <h3>LLMs already know it</h3>
          <p>
            The syntax is markdown lists, headers, and simple prefixes.
            Most models produce valid markup with zero or minimal system prompting.
          </p>
        </div>
        <div className="sc-why-card">
          <h3>Streaming-ready</h3>
          <p>
            Line-oriented syntax means the client can start rendering
            as tokens stream in. No waiting for complete JSON or XML.
          </p>
        </div>
        <div className="sc-why-card">
          <h3>SLM-tolerant</h3>
          <p>
            The built-in normalizer fixes common mistakes from smaller models:
            wrong list markers, checkbox variants, missing spaces, and more.
          </p>
        </div>
      </div>
    </section>
  );
}

function QuickStartSection() {
  const [tab, setTab] = useState<'react' | 'ios' | 'android'>('react');

  return (
    <section className="sc-section">
      <h2 className="sc-section-title">Get started in seconds</h2>
      <div className="sc-quickstart">
        <div className="sc-quickstart-tabs">
          <button
            className={`sc-quickstart-tab${tab === 'react' ? ' sc-quickstart-tab--active' : ''}`}
            onClick={() => setTab('react')}
          >
            React
          </button>
          <button
            className={`sc-quickstart-tab${tab === 'ios' ? ' sc-quickstart-tab--active' : ''}`}
            onClick={() => setTab('ios')}
          >
            iOS (SwiftUI)
          </button>
          <button
            className={`sc-quickstart-tab${tab === 'android' ? ' sc-quickstart-tab--active' : ''}`}
            onClick={() => setTab('android')}
          >
            Android (Compose)
          </button>
        </div>
        <div className="sc-quickstart-content">
          {tab === 'react' && (
            <pre>{`npm install @markdown2ui/parser @markdown2ui/react

import { Markdown2UI } from '@markdown2ui/react';
import '@markdown2ui/react/styles.css';

<Markdown2UI
  source={markup}
  onSubmit={(result) => sendToLLM(result)}
/>`}</pre>
          )}
          {tab === 'ios' && (
            <pre>{`// Package.swift
.package(url: "https://github.com/tiniclaw/markdown2ui.git",
         from: "0.9.0")

import Markdown2UI

Markdown2UIView(ast: ast) { result in
    sendToLLM(result)
}`}</pre>
          )}
          {tab === 'android' && (
            <pre>{`// build.gradle.kts
implementation(project(":markdown2ui"))

import com.markdown2ui.Markdown2UI

Markdown2UI(ast = ast) { result ->
    sendToLLM(result)
}`}</pre>
          )}
        </div>
      </div>
    </section>
  );
}

function CommunitySection({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <section className="sc-section sc-section-alt">
      <h2 className="sc-section-title">Built for the community</h2>
      <p className="sc-section-desc">
        markdown2ui is open source under Apache 2.0. We welcome contributions of all kinds.
      </p>
      <div className="sc-community-grid">
        <div className="sc-community-card">
          <h3>Build a renderer</h3>
          <p>Vue, Svelte, Flutter, terminal UI &mdash; bring markdown2ui to your platform.</p>
        </div>
        <div className="sc-community-card">
          <h3>Port the parser</h3>
          <p>Python, Go, Rust, Java &mdash; implement the spec in your language.</p>
        </div>
        <div className="sc-community-card">
          <h3>Improve the spec</h3>
          <p>Propose new block types, modifiers, or behaviors via the RFC process.</p>
        </div>
        <div className="sc-community-card">
          <h3>Fix &amp; document</h3>
          <p>Bug fixes, edge cases, tutorials, and translations all help.</p>
        </div>
      </div>
      <div className="sc-community-actions">
        <a
          className="sc-btn sc-btn-primary"
          href="https://github.com/tiniclaw/markdown2ui"
          target="_blank"
          rel="noopener"
        >
          View on GitHub
        </a>
        <button className="sc-btn sc-btn-secondary" onClick={() => onNavigate('docs')}>
          Read the Docs
        </button>
      </div>

      <div className="sc-roadmap">
        <h3>Roadmap to v1.0</h3>
        <ul>
          <li>Conditional visibility (show/hide blocks based on selections)</li>
          <li>Inline validation rules in markup</li>
          <li>Multi-page forms (wizard flow)</li>
          <li>Server-side parser implementations (Python, Go)</li>
          <li>npm / Swift Package / Maven registry publication</li>
          <li>Accessibility audit (ARIA, screen readers)</li>
        </ul>
      </div>
    </section>
  );
}
