import { useState, useEffect, useCallback } from 'react';
import { ShowcasePage } from './pages/ShowcasePage';
import { DocsPage } from './pages/DocsPage';
import { PlaygroundPage } from './pages/PlaygroundPage';

type Page = 'showcase' | 'docs' | 'playground';

function getPageFromHash(): Page {
  const hash = window.location.hash;
  if (hash === '#/docs') return 'docs';
  if (hash === '#/playground') return 'playground';
  return 'showcase';
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash);

  useEffect(() => {
    const handler = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((target: string) => {
    window.location.hash = target === 'showcase' ? '/' : `/${target}`;
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="app">
      {/* Top navigation */}
      <nav className="site-nav">
        <div className="site-nav-inner">
          <button className="site-nav-brand" onClick={() => navigate('showcase')}>
            markdown2ui
          </button>
          <div className="site-nav-links">
            <button
              className={`site-nav-link${page === 'showcase' ? ' site-nav-link--active' : ''}`}
              onClick={() => navigate('showcase')}
            >
              Showcase
            </button>
            <button
              className={`site-nav-link${page === 'docs' ? ' site-nav-link--active' : ''}`}
              onClick={() => navigate('docs')}
            >
              Docs
            </button>
            <button
              className={`site-nav-link${page === 'playground' ? ' site-nav-link--active' : ''}`}
              onClick={() => navigate('playground')}
            >
              Playground
            </button>
            <a
              className="site-nav-link"
              href="https://github.com/tiniclaw/markdown2ui"
              target="_blank"
              rel="noopener"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="site-main">
        {page === 'showcase' && <ShowcasePage onNavigate={navigate} />}
        {page === 'docs' && <DocsPage />}
        {page === 'playground' && <PlaygroundPage />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a href="https://github.com/tiniclaw/markdown2ui" target="_blank" rel="noopener">GitHub</a>
          <a href="https://github.com/tiniclaw/markdown2ui/blob/main/docs/markdown2ui-spec-v0_9.md" target="_blank" rel="noopener">Spec v0.9</a>
          <a href="https://github.com/tiniclaw/markdown2ui/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Contributing</a>
          <a href="https://github.com/tiniclaw/markdown2ui/blob/main/LICENSE" target="_blank" rel="noopener">Apache 2.0</a>
        </div>
        <p className="footer-copy">markdown2ui v0.9</p>
      </footer>
    </div>
  );
}

export default App;
