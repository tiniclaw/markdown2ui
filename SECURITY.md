# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes     |
| 0.x     | ❌ No      |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report via [GitHub Security Advisories](https://github.com/tiniclaw/markdown2ui/security/advisories/new). We will acknowledge your report within 72 hours and aim to publish a fix within 14 days of a confirmed vulnerability.

## Threat Model

### XSS

`@markdown2ui/react` does **not** use `dangerouslySetInnerHTML`. All user-visible text is rendered via React's safe interpolation (`{value}`), which escapes HTML entities by default.

Prose text from the parsed AST is rendered as `{block.text}` (not as HTML). Custom block renderers registered via the `blockRenderers` prop are the responsibility of the consuming application — if a custom renderer sets `innerHTML` or calls `dangerouslySetInnerHTML`, the application author is responsible for sanitizing the input.

### Markdown Parsing

The parser does not evaluate JavaScript, execute shell commands, or make network requests. It transforms a DSL string into an AST object; no dynamic execution occurs.

### Dependency Risk

Both packages have minimal runtime dependencies. Run `npm audit` regularly and keep the lock file updated.
