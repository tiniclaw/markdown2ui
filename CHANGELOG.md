# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-04-27

### Added

**Parser — 6 new language features:**
- **Conditional visibility** (`@if:fieldId==value` / `@if:fieldId!=value` suffix on any block) — blocks are hidden or shown based on the value of another field
- **Repeatable groups** (`{ Label @repeatable @min(N) @max(N)` ... `}`) — groups of fields that the user can add or remove rows of
- **Table input** (`[table: Label]` with `- Column: [text|number]` column definitions) — multi-row, multi-column editable grids
- **Computed fields** (`[computed Label @sum:f1,f2]` / `@count:groupId`) — read-only display fields that update reactively from form values
- **Plugin API** — `[custom:type key=value ...]` parser syntax + `blockRenderers` prop for custom React renderers
- **Localization defaults** — `ParseOptions.defaults.confirmationYesLabel / confirmationNoLabel` for server-side i18n of confirmation buttons
- `CustomBlock`, `TableBlock`, `ComputedBlock`, `Condition`, `ConditionOperator` types exported from `@markdown2ui/parser`

**React renderer:**
- `isBlockVisible(block, values)` exported utility — evaluates `@if` conditions
- `blockRenderers` prop on `<Markdown2UI>` — register custom React components for custom block types
- `strings` prop on `<Markdown2UI>` — override any UI string for localization (`M2UStrings` interface)
- `DEFAULT_STRINGS` and `M2UStrings` type exported from `@markdown2ui/react`
- `BlockRendererRegistry` type exported from `@markdown2ui/react`
- `TableInput` component for `[table]` blocks
- `ComputedField` component for `[computed]` blocks; excluded from serialization output
- Repeatable group support in `Group` component — scoped `FormContext` per row
- Condition-aware validation in `Markdown2UI` — hidden blocks are skipped during required-field checks
- Reactive serialization for conditional, repeatable, and table blocks in `serializeCompact` / `serializeVerbose`

**Tooling:**
- ESLint flat config (`eslint.config.js`) for both `parser` and `react` packages
- Separate `tsconfig.test.json` for `tsc --noEmit` checks including `__tests__/`
- `tsup.config.ts` for the parser package
- Prettier config at repo root
- `@vitest/coverage-v8` with enforced thresholds for both packages
- Full React renderer test suite — 123 tests across 13 files covering all 17 components

**CI/CD:**
- Rewrote `.github/workflows/ci.yml`: 4 jobs (`parser`, `react`, `playground`, `audit`) using artifact passing for `dist/` between jobs
- Hardened `.github/workflows/publish-npm.yml`: test + security audit gates before each `npm publish` step
- Added `id-token: write` permission to publish job

**Documentation:**
- `CHANGELOG.md` (this file)
- `SECURITY.md` — supported versions, vulnerability reporting via GitHub Security Advisories
- `.github/PULL_REQUEST_TEMPLATE.md` — structured PR checklist

### Changed

- AST `version` field bumped from `'0.9'` to `'1.0'`
- All 99 conformance test `.ast.json` fixtures updated to `"version": "1.0"`
- `ParseOptions` extended with `defaults` sub-object for confirmation label overrides
- `assemble()` signature changed to `assemble(tokens, options?)` — options now flow through to the assembler
- `GroupBlock` extended with `id?`, `repeatable?`, `minRows?`, `maxRows?` fields
- `BaseBlock` extended with optional `condition?: Condition` field

### Fixed

- Existing components (`SingleSelect`, `MultiSelect`, `FileUpload`, `Sequence`) now use `strings` from `FormContext` instead of hardcoded text — enabling full localization without component changes

[1.0.0]: https://github.com/tiniclaw/markdown2ui/releases/tag/v1.0.0
