# markdown2ui Test Suite

Conformance test suite for the markdown2ui v0.9 specification.

## Test Format

Each test case consists of two files sharing the same base name:

- `*.txt` — the markdown2ui input markup
- `*.ast.json` — the expected AST output after parsing

For submission tests, additional files:

- `*.values.json` — simulated user input values
- `*.compact.txt` — expected compact submission output
- `*.verbose.json` — expected verbose submission output

## Running Tests

Any conformant parser implementation should:

1. Read the `.txt` file
2. Parse it into an AST
3. Compare the result against the `.ast.json` file
4. All fields must match exactly (order-sensitive for arrays)

## Conventions

- `default` fields in date/time/datetime blocks use the placeholder `"NOW"` to indicate the parser should substitute the current date/time. Test runners should replace `"NOW"` with the actual current value before comparison.
- Test cases are organized by block type, with composite tests covering multi-block interactions.
- Edge case tests cover error recovery, malformed input, and ambiguous patterns.

## Directory Structure

```
tests/
  single-select/     Single-select (radio) block tests
  multi-select/      Multi-select (checkbox) block tests
  sequence/          Sequence (reorderable list) block tests
  confirmation/      Confirmation (yes/no) block tests
  text-input/        Text input block tests
  slider/            Slider/range block tests
  date-picker/       Date picker block tests
  time-picker/       Time picker block tests
  datetime-picker/   Datetime picker block tests
  file-upload/       File upload block tests
  image-upload/      Image upload block tests
  header/            Section header block tests
  hint/              Inline hint block tests
  divider/           Divider block tests
  prose/             Prose text block tests
  group/             Layout group block tests
  id-derivation/     Auto-ID derivation tests
  composite/         Multi-block integration tests
  submission/        Submission serialization tests
  edge-cases/        Error recovery and ambiguity tests
```
