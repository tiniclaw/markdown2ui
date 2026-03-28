# @markdown2ui/parser

Reference parser for the [markdown2ui](../../README.md) v0.9 specification. Converts plain-text markup into a structured AST (JSON).

Unlike JSON Schema or XML-based UI specs, markdown2ui markup is plain text that LLMs can generate with near-zero reasoning overhead — the syntax is barely more complex than a bulleted list. The parser handles the rest: tokenization, grouping, ID derivation, and optional normalization of common LLM mistakes.

## Installation

```bash
npm install @markdown2ui/parser
```

## API

### `parse(input: string): AST`

Parse markup into an AST.

```ts
import { parse } from '@markdown2ui/parser';

const ast = parse(`
Favorite color
- Red
- Blue (default)
- Green
`);

// ast.version === '0.9'
// ast.blocks[0].type === 'single-select'
```

### `normalize(input: string): string`

Fix common LLM/SLM mistakes before parsing. Handles wrong list markers (`*` instead of `-`), checkbox variants (`[v]` instead of `[x]`), missing spaces, and more.

```ts
import { parse, normalize } from '@markdown2ui/parser';

const fixed = normalize(sloppyMarkup);
const ast = parse(fixed);
```

## AST Structure

```ts
interface AST {
  version: '0.9';
  blocks: Block[];
}
```

`Block` is a union of 16 types: `single-select`, `multi-select`, `sequence`, `confirmation`, `text-input`, `typed-input`, `slider`, `date`, `time`, `datetime`, `file-upload`, `image-upload`, `header`, `hint`, `divider`, `prose`, `group`.

## Type Exports

All AST types are exported for use with TypeScript:

```ts
import type {
  AST, Block,
  SingleSelectBlock, SingleSelectOption,
  MultiSelectBlock, MultiSelectOption,
  SequenceBlock, ConfirmationBlock,
  TextInputBlock, TypedInputBlock,
  SliderBlock, DateBlock, TimeBlock, DatetimeBlock,
  FileUploadBlock, ImageUploadBlock,
  HeaderBlock, HintBlock, DividerBlock, ProseBlock, GroupBlock,
  FormatAnnotation, TypedInputFormat,
} from '@markdown2ui/parser';
```

## Conformance Tests

The parser is tested against 115+ conformance tests in [`tests/`](../../tests/). Each test pairs a `.txt` input with an `.ast.json` expected output.

## Links

- [Specification v0.9](../../docs/markdown2ui-spec-v0_9.md)
- [Live Playground](https://tiniclaw.github.io/markdown2ui/)
