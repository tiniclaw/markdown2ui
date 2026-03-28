# markdown2ui Playground & Documentation Site

Interactive showcase and documentation for the [markdown2ui](../../README.md) project. This is the source for the [GitHub Pages site](https://tiniclaw.github.io/markdown2ui/).

## Features

- **Showcase** — live, interactive demos of every markdown2ui component type
- **Interactive Playground** — write markup on the left, see native UI on the right
- **Multiple Renderers** — switch between Plain, shadcn/ui, Material UI, and JSON-render views
- **Documentation** — full markup reference, installation guides, and API docs
- **SLM-tolerant** — the normalizer is enabled in the playground, so common LLM mistakes parse correctly

## Local Development

```bash
# From the repo root — build dependencies first
cd packages/parser && npm install && npm run build
cd ../react && npm install && npm run build

# Run the playground
cd ../playground
npm install
npm run dev
```

The Vite dev server uses aliases to resolve `@markdown2ui/parser` and `@markdown2ui/react` from the local monorepo, so changes to the parser or renderer are reflected immediately.

## Build

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview the production build locally
```

The build output goes to `dist/` and is deployed to GitHub Pages via the workflow in `.github/workflows/deploy-pages.yml`.

## Structure

```
src/
├── App.tsx              # Router — switches between Showcase, Docs, Playground
├── pages/
│   ├── ShowcasePage.tsx  # Landing page with live demos
│   ├── DocsPage.tsx      # Full documentation
│   └── PlaygroundPage.tsx # Interactive editor + example gallery
├── components/
│   ├── LivePlayground.tsx # Real-time markup editor + preview
│   └── ExampleCard.tsx    # Side-by-side markup/preview card
├── renderers/            # Plain, shadcn, MUI, JSON-render implementations
├── data/examples.ts      # Example markup for all component types
└── styles.css            # Design tokens and layout
```

## Adding Examples

Edit `src/data/examples.ts` to add new showcase examples. Each example needs an `id`, `title`, `description`, and `markup` string.

## Deployment

Deployed automatically to GitHub Pages on push to `main` via GitHub Actions. See [`.github/workflows/deploy-pages.yml`](../../.github/workflows/deploy-pages.yml).
