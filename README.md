# markdown2ui

**Turn plain text into native UI.** A lightweight markup language that lets LLMs generate interactive forms without writing UI code.

```
                                          ┌─────────────────────────┐
> name: What's your name? | John Doe      │  What's your name?      │
                                          │  [John Doe         ]    │
Favorite color                   ──>      │                         │
- Red                                     │  Favorite color         │
- Blue (default)                          │  ○ Red  ● Blue  ○ Green │
- Green                                   │                         │
                                          │  Rate  ───●─── 7        │
~ rating: Rate [1-10] (7)                 └─────────────────────────┘ 
```

The LLM writes plain text. The client renders native UI. **No XML. No JSON. No layout code.**

[Live Playground & Docs](https://tiniclaw.github.io/markdown2ui/) | [Spec v0.9](docs/markdown2ui-spec-v0_9.md)

---

## Why markdown2ui?

Existing approaches force LLMs to generate structured UI code (JSON schemas, XML layouts, React components). This wastes reasoning capacity and adds latency. markdown2ui takes a different approach:

| | Traditional | markdown2ui |
|---|---|---|
| **LLM output** | JSON/XML/JSX with layout logic | Plain text, barely more than a bulleted list |
| **Reasoning overhead** | High — LLM must think about structure, nesting, types | Minimal — write what you need, nothing more |
| **System prompt** | Large schema definitions required | A few lines of examples suffice |
| **Platform support** | One framework at a time | Same markup renders on Web, iOS, Android |
| **Streaming** | Must wait for complete JSON/XML | Line-oriented, render as tokens arrive |
| **Customizability** | Tied to specific component libraries | Renderer owns all design decisions |

### Key Design Principles

1. **Zero cognitive overhead for the LLM** — the markup is barely more complex than a bulleted list
2. **Platform-agnostic** — same markup renders natively on Web (React), iOS (SwiftUI), Android (Compose)
3. **Language-agnostic** — the spec is just text; implement a parser in any language
4. **Streaming-ready** — line-oriented syntax enables progressive rendering
5. **Pre-fill first** — LLM pre-selects the most likely answer; user confirms or adjusts
6. **Semantic, not visual** — markup defines *what* input is needed, never *how* it looks

---

## Quick Start

### Web (React)

```bash
npm install @markdown2ui/parser @markdown2ui/react
```

```tsx
import { Markdown2UI } from '@markdown2ui/react';
import '@markdown2ui/react/styles.css';

function ChatUI({ markup }: { markup: string }) {
  return (
    <Markdown2UI
      source={markup}
      onSubmit={(result) => console.log(result)}
    />
  );
}
```

### iOS (SwiftUI)

Add the SPM dependency, then decode the JSON AST from the parser:

```swift
import Markdown2UI

let ast = try JSONDecoder().decode(Markdown2UIModel.self, from: jsonData)

Markdown2UIView(ast: ast) { result in
    print(result)
}
```

### Android (Jetpack Compose)

Add the Gradle dependency, then deserialize the AST:

```kotlin
import com.markdown2ui.Markdown2UI
import com.markdown2ui.Markdown2UIModel

val ast = Json.decodeFromString<Markdown2UIModel>(jsonString)

Markdown2UI(ast = ast) { result ->
    println(result)
}
```

See each package's README for detailed setup:
[`@markdown2ui/parser`](packages/parser/) |
[`@markdown2ui/react`](packages/react/) |
[`iOS`](packages/ios/) |
[`Android`](packages/android/)

---

## Supported Components

| Block | Syntax | Description |
|-------|--------|-------------|
| **Single-select** | `- Option` | Radio group, first option pre-selected |
| **Multi-select** | `- [x] Option` | Checkboxes with pre-selection |
| **Text input** | `> Label` / `>> Multiline` | With `\|` placeholder, `\|\|` prefill |
| **Typed input** | `@email`, `@tel`, `@url`, `@number`, `@password`, `@color` | Validated inputs |
| **Slider** | `~ Label [min-max] (default)` | Bounded numeric range |
| **Date/Time** | `@date`, `@time`, `@datetime` | Native pickers |
| **Confirmation** | `?! Question` | Binary yes/no prompt |
| **File upload** | `[Label](.pdf)` | With extension filtering |
| **Image upload** | `![Label]()` | Camera/gallery trigger |
| **Sequence** | `1. Item` | Reorderable list |
| **Header** | `# Title` | Section headers |
| **Hint** | `// text` | Contextual help text |
| **Divider** | `---` | Visual separator |
| **Group** | `{ name ... }` | Adaptive column layout |

### Format annotations

Display-only formatting (submitted value is always raw):

```
~ price: Price [0-1000] (500) @currency(USD)     →  $500.00
~ weight: Weight [0-100] (75) @unit(kg)           →  75 kg
~ progress: Done [0-100] (80) @percent             →  80%
```

### Image options

Attach thumbnail images to select options for card-grid layouts:

```
Where to?
- ![](paris.jpg) Paris
- ![](tokyo.jpg) Tokyo (default)
- ![](nyc.jpg) New York
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      LLM / Agent                        │
│          Writes markdown2ui markup (plain text)         │
└────────────────────────┬────────────────────────────────┘
                         │
                    markup string
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                @markdown2ui/parser                      │
│    Tokenize → Group → Derive IDs → Build AST (JSON)     │
│    Optional: normalize (fix common SLM mistakes)        │
└────────────────────────┬────────────────────────────────┘
                         │
                      AST JSON
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │   React    │ │  SwiftUI   │ │  Compose   │
   │  Renderer  │ │  Renderer  │ │  Renderer  │
   └────────────┘ └────────────┘ └────────────┘
     Web/RN          iOS/macOS      Android
```

Each renderer owns all design decisions — colors, spacing, layout, component library. The markup never dictates visual appearance.

---

## For LLM Integration

markdown2ui is designed so that LLMs need **minimal instructions** to generate valid markup. A system prompt as short as this works:

```
When you need user input, write markdown2ui markup:
- Options: "Label\n- Option 1\n- Option 2"
- Text input: "> Label | placeholder"
- Required: add ! (e.g., ">! Label", "Label!")
The client will render native UI from your markup.
```

The normalizer handles common mistakes (wrong list markers, checkbox variants, missing spaces), making the system robust even with smaller models.

**Submission formats:**

- **Compact** — flat key-value pairs, minimal tokens for the LLM to parse
- **Verbose** — full metadata including labels, types, and selected indices

---

## Roadmap to v1.0

- [ ] Conditional visibility (`@if field == value`)
- [ ] Repeatable groups (dynamic add/remove rows)
- [ ] Table input (spreadsheet-like grid)
- [ ] Computed fields (`@sum`, `@count`)
- [ ] Plugin API for custom block types
- [ ] Server-side validation schema export
- [ ] npm/Swift/Kotlin package registry publishing
- [ ] Localization support (i18n labels)

---

## Project Structure

```
markdown2ui/
├── packages/
│   ├── parser/       TypeScript reference parser (ESM + CJS)
│   ├── react/        React renderer component library
│   ├── ios/          SwiftUI native renderer + demo app
│   ├── android/      Jetpack Compose native renderer + demo app
│   └── playground/   Interactive documentation site (GitHub Pages)
├── examples/
│   ├── ios-sample/         Standalone iOS demo
│   ├── android-sample/     Standalone Android demo
│   └── react-native-sample/  React Native example
├── tests/            117+ test cases across 30 categories
├── docs/             Specification documents
└── README.md
```

---

## Contributing

We welcome contributions of all kinds — new renderers, parser improvements, documentation, bug fixes, and spec proposals.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up your development environment
- Code style and conventions
- Submitting issues and pull requests
- The RFC process for spec changes

---

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
