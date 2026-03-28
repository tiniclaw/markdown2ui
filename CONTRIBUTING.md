# Contributing to markdown2ui

Thank you for your interest in contributing! markdown2ui thrives on community input — bug fixes, new renderers, parser ports, documentation, and spec proposals are all welcome.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming and inclusive environment.

---

## Ways to Contribute

- **Report bugs** — file an issue with reproduction steps
- **Fix bugs** — parser edge cases, renderer inconsistencies
- **Build new renderers** — Vue, Svelte, Flutter, terminal UI, etc.
- **Port the parser** — Python, Go, Rust, Java implementations
- **Improve documentation** — tutorials, examples, translations
- **Write tests** — edge cases and normalizer coverage
- **Propose spec changes** — new block types, modifiers, or behaviors

Good first issues are labeled [`good first issue`](https://github.com/tiniclaw/markdown2ui/labels/good%20first%20issue).

---

## Prerequisites

- **Node.js** 20+ and **npm** 9+
- **Xcode 15+** (for iOS package, optional)
- **Android Studio** + JDK 17 (for Android package, optional)

## Repository Structure

```
packages/
  parser/      TypeScript parser (markup -> AST)
  react/       React renderer component
  playground/  Interactive docs & playground site
  ios/         SwiftUI renderer + demo app
  android/     Jetpack Compose renderer + demo app
tests/         Conformance test suite (.txt + .ast.json pairs)
docs/          Specification (v0.9)
```

You don't need to set up all packages — pick the one relevant to your change.

## Local Development

```bash
# Clone
git clone https://github.com/tiniclaw/markdown2ui.git
cd markdown2ui

# Build parser (must be first)
cd packages/parser && npm ci && npm run build && cd ../..

# Build React renderer
cd packages/react && npm ci && npm run build && cd ../..

# Run playground dev server
cd packages/playground && npm ci && npm run dev
```

The playground uses Vite aliases to reference the local parser and react packages, so changes are reflected immediately during development.

---

## Running Tests

```bash
cd packages/parser
npm test            # Run all tests
npm run test:watch  # Watch mode
```

The test suite discovers all `.txt` + `.ast.json` pairs in `tests/` automatically. Each test:
1. Reads `input.txt` as markup
2. Parses it with the parser
3. Compares the output AST to `input.ast.json`

### Adding Conformance Tests

If you're adding or modifying syntax, add a conformance test:

1. Create `tests/<category>/<test-name>.txt` with the input markup
2. Create `tests/<category>/<test-name>.ast.json` with the expected AST output
3. Run `npm test` in `packages/parser` to verify

---

## Pull Request Process

1. **Fork** the repository and create a branch from `main`.
2. **Branch naming**: `feature/`, `fix/`, `docs/`, or `test/` prefix.
3. Make your changes.
4. **Run tests**: `cd packages/parser && npm test`
5. **Build playground**: `cd packages/playground && npm run build`
6. Add conformance tests if you changed parsing behavior.
7. Submit a PR against `main` using the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

### Branch Protection Rules

- The `main` branch is protected — all changes go through pull requests.
- PRs require at least one approving review before merge.
- CI checks (tests, lint, build) must pass before merging.
- No force-pushes to `main`.
- Squash merges preferred for single-purpose PRs.

### Commit Messages

Use conventional commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `test:` adding or updating tests
- `chore:` build, CI, or tooling changes

---

## Spec Change Process (RFC)

The markdown2ui specification defines the markup syntax and AST structure. Changes affect all platforms and must be carefully considered.

**To propose a spec change:**

1. Open an issue with the `rfc` label describing the proposed change.
2. Include concrete markup examples (before/after).
3. Explain how each platform renderer should handle it.
4. Discuss trade-offs and backward compatibility.
5. After consensus, submit a PR updating the spec document and reference parser.

**Guiding principles for spec changes:**

- Does this keep the LLM's job simple?
- Can it be expressed naturally in one or two lines of markup?
- Does it work across all platforms without platform-specific logic?
- Is the default behavior sensible without configuration?

---

## Code Standards

- TypeScript strict mode, avoid unjustified `any`
- Functional components with hooks (React)
- Pure functions for parsing logic
- Follow existing patterns in the codebase
- No unnecessary abstractions or premature optimization
- Swift API Design Guidelines (iOS)
- Kotlin coding conventions with Material 3 (Android)

---

## Reporting Bugs

Use the [bug report template](https://github.com/tiniclaw/markdown2ui/issues/new?template=bug_report.md) and include:
- Which package is affected
- Input markup that reproduces the issue
- Expected vs actual behavior
- Version information

---

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
