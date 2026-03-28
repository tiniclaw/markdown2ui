# @markdown2ui/react

React renderer for [markdown2ui](../../README.md) v0.9. Renders interactive form UI from markup or a pre-parsed AST.

The renderer owns all design decisions — layout, spacing, colors, component style. The markup only describes *what* input is needed, never *how* it looks. This keeps the LLM focused on reasoning while the client delivers a polished, platform-native experience. Supports both compact (key-value) and verbose (full metadata) submission formats to match your LLM integration needs.

## Installation

```bash
npm install @markdown2ui/react @markdown2ui/parser
```

## Usage

```tsx
import { Markdown2UI } from '@markdown2ui/react';
import '@markdown2ui/react/styles.css';

function App() {
  const markup = `
> name: Your name | John Doe
Favorite color
- Red
- Blue (default)
- Green
`;

  return (
    <Markdown2UI
      source={markup}
      onSubmit={(result) => console.log(result)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `string \| AST` | required | Raw markup string or pre-parsed AST |
| `normalizeInput` | `boolean` | `false` | Run the normalizer to fix SLM mistakes |
| `format` | `'compact' \| 'verbose'` | `'compact'` | Submission output format |
| `onSubmit` | `(result, ast) => void` | - | Called when the user submits |
| `submitLabel` | `string` | `'Submit'` | Submit button label |
| `className` | `string` | - | Additional CSS class |

## Submission Formats

**Compact** (default) — flat key-value pairs, minimal tokens:

```
name: John Doe
favorite_color: Blue
```

**Verbose** — full metadata:

```json
{
  "name": { "type": "text-input", "label": "Your name", "value": "John Doe" },
  "favorite_color": { "type": "single-select", "label": "Favorite color", "value": "Blue" }
}
```

## Theming

Import the default styles, then override CSS custom properties:

```css
.m2u-form {
  --m2u-font: 'Inter', sans-serif;
  --m2u-radius: 8px;
  --m2u-accent: #6366f1;
}
```

## Icon Resolution

The package exports utilities for custom icon resolution:

```ts
import {
  processText, processTextGroup,
  createAssetResolver, createMapResolver, chainResolvers,
} from '@markdown2ui/react';
```

## Links

- [Live Playground](https://tiniclaw.github.io/markdown2ui/)
- [Parser package](../parser/)
- [Specification v0.9](../../docs/markdown2ui-spec-v0_9.md)
