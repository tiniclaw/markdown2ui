# Markdown2UI for iOS

SwiftUI native renderer for [markdown2ui](../../README.md) v0.9. Renders interactive forms from a JSON AST.

markdown2ui is platform-agnostic — the same markup that renders as React components on the web renders as native SwiftUI views on iOS. No webviews, no HTML. The LLM writes one simple markup; each platform renders with its own toolkit. This package provides the iOS side of that contract.

## Requirements

- iOS 17.0+ / macOS 14.0+
- Swift 5.9+
- Xcode 15+

## Installation

### Swift Package Manager

Add the dependency in Xcode or in your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/tiniclaw/markdown2ui.git", from: "0.9.0")
]
```

Then add `Markdown2UI` to your target dependencies.

## Usage

The renderer takes a JSON AST (produced by the TypeScript parser) and renders native SwiftUI:

```swift
import Markdown2UI

struct FormView: View {
    let jsonString: String  // AST JSON from the parser

    var body: some View {
        if let view = Markdown2UIView(jsonString: jsonString, onSubmit: { result in
            print(result)
        }) {
            view
        }
    }
}
```

You can also decode the AST directly:

```swift
let ast = try JSONDecoder().decode(Ast.self, from: jsonData)
Markdown2UIView(ast: ast, onSubmit: { result in ... })
```

## Features

- All 16 block types rendered with native SwiftUI components
- Adaptive layout: segmented pickers for short options, grouped lists for long text
- SF Symbols icon resolution for `:name:` syntax
- Image options with `AsyncImage` in a `LazyVGrid`
- Form validation and compact/verbose serialization

## Demo App

See [`DemoApp/`](DemoApp/) for a complete example with:
- **Editor tab** — type markdown2ui markup, parsed via embedded JavaScriptCore
- **Showcase tab** — pre-built examples

## Source Files

| File | Description |
|------|-------------|
| `Model.swift` | AST data types (Codable) |
| `Markdown2UIView.swift` | Root view component |
| `BlockViews.swift` | All block type renderers |
| `FormState.swift` | State management + serialization |
| `IconText.swift` | SF Symbols icon resolution |
| `FormatUtils.swift` | Number/currency formatting |

## Links

- [Specification v0.9](../../docs/markdown2ui-spec-v0_9.md)
- [Live Playground](https://tiniclaw.github.io/markdown2ui/)
