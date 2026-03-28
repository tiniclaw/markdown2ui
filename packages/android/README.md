# Markdown2UI for Android

Jetpack Compose native renderer for [markdown2ui](../../README.md) v0.9. Renders interactive forms from a JSON AST.

markdown2ui is platform-agnostic — the same markup that renders as React components on the web renders as native Compose UI on Android. No webviews, no HTML. The LLM writes one simple markup; each platform renders with its own toolkit. This package provides the Android side of that contract using Material 3.

## Requirements

- minSdk 26, compileSdk 35
- Kotlin 2.1+
- Jetpack Compose BOM 2024.06+

## Installation

Currently a local module. Add to your project:

```kotlin
// settings.gradle.kts
include(":markdown2ui")
project(":markdown2ui").projectDir = file("path/to/packages/android")

// app/build.gradle.kts
dependencies {
    implementation(project(":markdown2ui"))
}
```

## Usage

Deserialize the AST JSON (produced by the TypeScript parser) and render:

```kotlin
import com.markdown2ui.Ast
import com.markdown2ui.Markdown2UI
import kotlinx.serialization.json.Json

val ast = Json.decodeFromString<Ast>(jsonString)

@Composable
fun FormScreen() {
    Markdown2UI(
        ast = ast,
        onSubmit = { result -> println(result) }
    )
}
```

## Features

- All 16 block types rendered with Material 3 components
- Adaptive layout: segmented buttons for short options, grouped cards for long text (measured at runtime via `SubcomposeLayout`)
- Icon resolution with system drawables and emoji fallback
- Image options with Coil `AsyncImage`
- Form validation and compact/verbose serialization

## Dependencies

- Compose Material 3
- kotlinx-serialization-json
- Coil Compose (image loading)

## Demo App

See [`demo/`](demo/) for a complete example with:
- **Editor tab** — type markdown2ui markup, parsed via embedded WebView + JS parser
- **Showcase tab** — pre-built examples

## Source Files

| File | Description |
|------|-------------|
| `Model.kt` | AST data types (Serializable) |
| `Markdown2UI.kt` | Root composable |
| `BlockRenderer.kt` | All block type renderers |
| `FormState.kt` | State management + serialization |
| `IconText.kt` | Icon resolution composable |
| `FormatUtils.kt` | Number/currency formatting |

## Links

- [Specification v0.9](../../docs/markdown2ui-spec-v0_9.md)
- [Live Playground](https://tiniclaw.github.io/markdown2ui/)
