# markdown2ui Specification v0.9

## Philosophy

When an AI agent encounters a task that requires user input (clarification, choices, confirmation), it should **not** generate a rich UI programmatically — doing so taxes the LLM's reasoning capacity and adds latency. Instead, the agent writes a lightweight plaintext markup called `markdown2ui`, which the client parses into native UI components.

This keeps the LLM focused on **thinking**, not **rendering**.

---

## Design Principles

1. **Zero cognitive overhead for the LLM** — the markup is barely more complex than writing a bulleted list.
2. **Native rendering** — the client (Android, iOS, Web, TV) parses the markup and renders platform-native components. The LLM never sees XML, JSON, or layout code.
3. **Freestyle fallback** — every selection component allows the user to type a freeform answer instead of selecting from options, because discrete options can never cover every case. (Can be disabled with `!`.)
4. **Composable** — multiple blocks can appear in a single response, forming a mini-form.
5. **Streamable** — the markup is line-oriented so the client can begin rendering as tokens stream in.
6. **Pre-fill first** — the LLM should pre-select the most likely answer for every input. The user's job is to confirm or adjust, not to answer from scratch.
7. **Semantic, not visual** — the markup defines *what* input is needed, never *how* it looks. The renderer owns all layout decisions.
8. **Multi-turn branching** — conditional logic belongs in the conversation, not the form. The LLM asks follow-up questions based on previous answers rather than embedding conditionals in markup.

---

# Part 1: Markup Schema

## Identifiers

Every interactive block has an **ID** used as the submission key. IDs are determined in two ways:

### Explicit ID

The LLM can assign a stable, machine-readable ID by placing `id:` in the appropriate position for each block type:

- **Text input, slider, date/time/datetime:** After the prefix sigil, before the label.
  ```
  > project_name: What is your project name?
  ~ budget: Budget [100 - 10000] (1000)
  @date checkin: Check-in date | 2026-03-26
  ```
- **Single-select, multi-select, sequence:** On the **label line** above the options.
  ```
  lang: Preferred language
  - Kotlin
  - Java
  - Swift
  ```
- **File/image upload:** Inside the brackets.
  ```
  [report: Upload the report](.pdf)
  ![photo: Upload a photo]()
  ```
- **Confirmation:** After the `?!` prefix.
  ```
  ?! delete_confirm: Are you sure? ? Yes, delete it. : No, keep it.
  ```

**Rules:**

- Must match `[a-z][a-z0-9_]*` — lowercase ASCII letters, digits, and underscores only.
- The `id:` portion is stripped from the display label.

### Auto-Derived ID

If no explicit ID is provided, the parser derives one from the label text:

1. Lowercase the entire label.
2. Remove all non-ASCII characters.
3. Replace spaces, hyphens, and special characters with `_`.
4. Collapse consecutive underscores.
5. Strip leading and trailing underscores.
6. If the result is empty or starts with a digit, prefix with `field_`.

| Label | Auto-Derived ID |
|-------|-----------------|
| `What is your project name?` | `what_is_your_project_name` |
| `Region` | `region` |
| `Check-in date` | `check_in_date` |
| `Budget (만원)` | `budget` |
| `1박 예산` | `field_1` |

**Collision handling:** If two blocks produce the same ID, the parser appends `_2`, `_3`, etc. to subsequent duplicates.

---

## Required Fields (`!`)

The `!` modifier marks a field as required. Its meaning varies by block type:

| Block Type | `!` Meaning |
|------------|-------------|
| Text input | Non-empty required |
| Typed input | Non-empty required + type-specific validation enforced |
| Single-select | Freestyle is disabled — user must pick from options |
| Multi-select (label `!`) | At least one option must be selected |
| Multi-select (option `!`) | That specific option must be checked (see Per-Option Required) |
| Date / Time / Datetime | Field must have a value (cannot be cleared) |
| File / Image upload | A file must be provided |
| Confirmation | N/A (`?!` is the prefix itself, not a required marker) |
| Sequence | N/A (all items are always present) |

**Placement:**

- **With explicit ID:** `!` attaches to the ID, before the `:`.
  ```
  > company!: Company name
  @date checkin!: Check-in date
  lang!: Preferred language
  [logo!: Upload your logo]()
  ```
- **Without explicit ID:** `!` attaches to the prefix or label.
  ```
  >! Company name
  @date! Check-in date
  Preferred language!
  [! Upload your logo]()
  ```

---

## Block Types

### 1. Single-Select (Radio)

A **label line** followed by dash-prefixed options. Exactly one may be selected. The **first option is pre-selected by default** and treated as the recommended choice.

```
Preferred language
- Kotlin
- Java
- Swift
```

**Semantics:** Radio group. Kotlin is pre-selected.

To change the default/recommended option, mark it with `(default)`:

```
Preferred language
- Kotlin
- Java (default)
- Swift
```

With explicit ID:

```
lang: Preferred language
- Kotlin
- Java
- Swift
```

#### Required Single-Select

When `!` is used, the freestyle text input is **not rendered**. The user must pick from the provided options.

```
lang!: Preferred language
- Kotlin
- Java
- Swift
```

Without explicit ID:

```
Preferred language!
- Kotlin
- Java
- Swift
```

#### Freestyle

A compact text input is always rendered below the last option with placeholder text: _"Or type your answer..."_

When the user types in the freestyle field, it **replaces** the selected option.

**Exception:** If the block is marked required (`!`), the freestyle field is not rendered.

#### Label Line

The label line is a plain text line that appears **immediately before** the first option line. It serves as both the display label and the source for the block's ID.

**Parsing rule:** A line is consumed as a select label (not prose) only if the **next line** starts a select group (`-` for single-select, `- [x]`/`- [ ]` for multi-select, `N.` for sequence). This requires one-line lookahead.

---

### 2. Multi-Select (Checkbox)

A **label line** followed by task-list-style options. Zero or more may be selected. `- [x]` marks a pre-selected (recommended) option. `- [ ]` marks an unselected option.

```
Requirements
- [x] Non-smoking
- [ ] Breakfast included
- [ ] Large bath
- [ ] Single room
```

**Semantics:** Checkbox group. Non-smoking is pre-checked.

With explicit ID:

```
conditions: Requirements
- [x] Non-smoking
- [ ] Breakfast included
- [ ] Large bath
- [ ] Single room
```

#### Required Multi-Select

When `!` is used, at least one option must be selected. Submit is disabled if none are checked and no freestyle text is entered.

```
conditions!: Requirements
- [x] Non-smoking
- [ ] Breakfast included
- [ ] Large bath
- [ ] Single room
```

Without explicit ID:

```
Requirements!
- [x] Non-smoking
- [ ] Breakfast included
- [ ] Large bath
- [ ] Single room
```

#### Per-Option Required

Individual options can be marked as required with `!` after the closing bracket. The user **must** check these specific options before submitting.

```
Agreements
- [ ]! Terms of Service
- [x] Newsletter
```

**Semantics:** "Terms of Service" must be explicitly checked. "Newsletter" is pre-selected but optional (can be unchecked).

```
Consents
- [x]! I agree to the privacy policy
- [ ]! I accept the terms of use
- [x] Send me updates
```

**Semantics:** Privacy policy and terms are mandatory. Updates is optional.

This is different from label-level `!` (which means "at least one"):

- `Requirements!` → at least one option must be selected
- `- [ ]! Option` → this specific option must be checked

Both can coexist. Per-option `!` adds the `required: true` field to individual options in the AST.

#### Freestyle

A compact text input is always rendered below the last option with placeholder text: _"Or add your own..."_

When the user types in the freestyle field, it is **appended** as an additional selection alongside checked items.

#### Image Options

Both single-select and multi-select support thumbnail images on options. Use markdown image syntax `![alt](url)` at the start of an option's text:

```
destination: Where to?
- ![](https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop) Paris
- ![](https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop) Tokyo (default)
- ![](https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=400&h=300&fit=crop) New York
```

Multi-select with images:

```
activities: What interests you?
- [x] ![](https://example.com/hiking.jpg) Hiking
- [ ] ![](https://example.com/food.jpg) Food tours
- [ ] ![](https://example.com/diving.jpg) Snorkeling
```

**Parsing:** The parser extracts `![alt](url)` from the leading position of option text. The `url` is stored in the AST as `image` on each option. The remaining text becomes the option's `text` field.

**Rendering:** When any option in a group has an image, the renderer switches from the default layout (chips, radio buttons, checkboxes) to a card grid. Images within the same group are rendered at a consistent size using a fixed aspect ratio (e.g., 4:3) with `object-fit: cover` (or platform equivalent).

#### Option Label : Description

Option text may contain a colon (`:`) to separate a **label** from a **description**:

```
plan: Choose a plan
- Pro: Best for professionals
- Team: Collaborate with your team
- Enterprise: Custom solutions for large orgs
```

**Parsing:** The colon is not parsed specially — the full text (e.g., `Pro: Best for professionals`) remains the option's `text` field and is used as-is for form submission.

**Rendering:** This is a renderer-side convention. When an option's text contains a colon, the renderer **bolds** the portion before the first colon and renders the portion after in normal weight. If no colon is present, the entire text renders normally. This is optional — renderers may choose not to apply this styling.

---

### 3. Sequence (Reorderable List)

A **label line** followed by numbered options. The user can **drag to reorder** the items. The numbers define the initial order.

```
Priority
1. Speed
2. Cost
3. Reliability
```

**Semantics:** Reorderable list. The user can rearrange items by dragging.

With explicit ID:

```
priority: Arrange by priority
1. Speed
2. Cost
3. Reliability
```

**Numbering:** Numbers define initial display order. The actual number values are ignored — options are ordered by appearance. Repeated numbers (e.g., all `1.`) are accepted; the parser assigns order by appearance.

**No freestyle.** Sequence blocks do not include a freestyle input — they are about ordering existing items, not adding new ones.

**No default marking.** All items are always present; there is no selection to default.

---

### 4. Confirmation

A binary decision prompt. Default is always **No** (safe/unchanged state). **Yes** means confirming the action (changing from the current state).

```
?! Are you sure you want to delete this file?
```

**Semantics:** A prompt with two buttons: **[No]** (primary/default) and **[Yes]** (secondary).

#### Custom Button Labels (Ternary Syntax)

Optional custom labels for the Yes/No buttons using `? yes_label : no_label` at the end:

```
?! Are you sure you want to delete this file? ? Yes, delete it. : No, keep it.
```

**Semantics:** **[No, keep it.]** is primary/default, **[Yes, delete it.]** is secondary.

If the ternary is omitted, buttons default to **[Yes]** and **[No]**.

**Parsing:** The parser scans from the end of the line for the pattern ` ? <text> : <text>`. The ` : ` delimiter (space-colon-space) anchors the split. Everything before the ternary `?` (after the `?!` prefix) is the question text.

With explicit ID:

```
?! delete_confirm: Delete this file? ? Yes, delete it. : No, keep it.
```

---

### 5. Text Input

When the agent needs freeform text.

Single-line:

```
> What is your project name?
```

Multi-line:

```
>> Describe the bug you encountered.
```

Optional placeholder text after `|`:

```
> What is your project name? | e.g., MyApp
>> Describe the bug you encountered. | Steps to reproduce, expected vs actual behavior...
```

Optional pre-filled value after `||`:

```
> What is your project name? | e.g., MyApp || MyAwesomeApp
>> Notes || The server crashed at 3am when traffic spiked.
```

- `|` sets placeholder (shown when empty, disappears on focus).
- `||` sets a pre-filled value (editable, submitted as-is if unchanged).
- Both may coexist: `> Label | placeholder || prefill`

With explicit ID:

```
> project_name: What is your project name? | e.g., MyApp || MyAwesomeApp
```

#### Required Text Input

```
>! Company name
>>! Describe the issue
```

With explicit ID:

```
> company!: Company name
>> issue!: Describe the issue
```

**Semantics:** The form cannot be submitted until required fields have non-empty values. See §3.7 Validation.

---

### 6. Typed Input

For inputs that require a specific data type. Uses `@type` prefixes that map to HTML `<input type="...">` semantics.

**Supported types:** `@email`, `@tel`, `@url`, `@number`, `@password`, `@color`

```
@email Email address
@tel Phone number
@url Website
@number Quantity
@password Secret key
@color Theme color
```

**Placeholder (`|`), pre-fill (`||`), and required (`!`) syntax** works identically to text input:

```
@email Email | user@example.com
@email Email | user@example.com || admin@example.com
@email! Email
```

With explicit ID:

```
@email user_email: Email | user@example.com
@password! pw: Password
@number amount: Amount
```

**Format annotations** (see §Format Annotations) can be appended to `@number`:

```
@number amount: Amount @currency(KRW)
@number weight: Weight @unit(kg)
```

**Semantics:**

| Prefix | Input behavior | Submission value |
|--------|---------------|-----------------|
| `@email` | Email keyboard, `@` validation | Raw string |
| `@tel` | Phone keyboard/dialer | Raw string |
| `@url` | URL keyboard, `://` hint | Raw string |
| `@number` | Numeric keyboard, decimal support | Raw numeric string |
| `@password` | Masked input | Raw string |
| `@color` | Color picker (platform-native) | Hex string (e.g., `#ff6600`) |

**Validation:**

- `@email` — basic email format validation (contains `@` and domain).
- `@url` — basic URL format validation.
- `@tel` — no strict validation (formats vary by region).
- `@number` — numeric-only validation.
- `@password` — no format validation.
- `@color` — valid hex color.

---

### 7. Format Annotations

Format annotations control how numeric values are **displayed** to the user. They are appended to `@number` typed inputs and `~` slider blocks.

**Important:** Format annotations are display-only. The submitted value is always the raw number.

#### `@currency(CODE)`

ISO 4217 currency code. Rendered locale-aware via `Intl.NumberFormat` (or platform equivalent).

```
@number price: Price @currency(USD)
~ budget: Budget [1000 - 10000] (5000) %1000 @currency(KRW)
```

Display examples (for value `5000`):
- `@currency(KRW)` → `₩5,000` (ko-KR), `KRW 5,000` (en-US)
- `@currency(USD)` → `$5,000` (en-US), `US$5,000` (ko-KR)

#### `@unit(text)`

Literal suffix appended to the displayed value.

```
@number weight: Weight @unit(kg)
```

Display: `50` → `50kg`

**Plural-aware form:** Use `singular|plural` inside the parentheses.

```
@number stars: Stars @unit(star|stars)
```

Display: `1` → `1 star`, `5` → `5 stars`

#### `@percent`

Displays the value as a percentage.

```
@number rate: Interest rate @percent
~ opacity: Opacity [0 - 100] (100) @percent
```

Display: `75` → `75%`

#### `@integer`

No decimal places. Rounds to nearest integer for display.

```
@number qty: Quantity @integer
```

#### `@decimal(N)`

Fixed number of decimal places.

```
@number rate: Exchange rate @decimal(4)
```

Display: `1234.5` → `1234.5000`

**Combining annotations:** Only one format annotation is allowed per block. If multiple are present, the last one wins.

**Scope:** Format annotations can be used on:
- `@number` typed input
- `~` slider

---

### 8. Section Header / Label

Provides context or groups questions together. Does not produce an interactive element.

```
# Choose your preferences
```

Subsections:

```
## Build Settings
```

---

### 9. Slider / Range

For numeric input within a bounded range.

```
~ How many items? [1 - 100] (10)
```

- `[min - max]` defines the range.
- `(default)` sets the initial value.
- Decimal values are supported for min, max, default, and step (e.g., `[0.5 - 10.0] (2.5) %0.5`).

Optional step size after `%`:

```
~ Budget (만원) [5 - 50] (15) %5
```

This creates a slider that snaps to increments of 5 (5, 10, 15, 20...).

Optional format annotation (see §Format Annotations) appended after step:

```
~ budget: Budget [1000 - 10000] (5000) %1000 @currency(KRW)
~ weight: Weight [0.5 - 100.0] (10.0) %0.5 @unit(kg)
~ opacity: Opacity [0 - 100] (100) @percent
```

Format annotations affect display only; the submitted value is always the raw number.

With explicit ID:

```
~ budget: Budget (만원) [5 - 50] (15) %5
```

---

### 10. Date Picker

```
@date When should we schedule this?
```

**Semantics:** A native date picker. Returns `YYYY-MM-DD`.

**Default value:** If no default is provided, initializes to the **current date** (`today`).

Optional explicit default after `|`:

```
@date Check-in date | 2026-03-26
```

With explicit ID:

```
@date checkin: Check-in date | 2026-03-26
```

#### Required Date

```
@date! Check-in date
@date checkin!: Check-in date
```

---

### 11. Time Picker

```
@time What time works for you?
```

**Semantics:** A native time picker. Returns `HH:MM` (24-hour).

**Default value:** If no default is provided, initializes to the **current time** (rounded to the nearest appropriate increment).

Optional explicit default after `|`:

```
@time Meeting time | 14:00
```

#### Required Time

```
@time! Meeting time
@time meeting!: Meeting time
```

---

### 12. Datetime Picker

```
@datetime When exactly?
```

**Semantics:** A combined date and time picker. Returns `YYYY-MM-DDTHH:MM`.

**Default value:** If no default is provided, initializes to **now** (current date and time).

Optional explicit default after `|`:

```
@datetime Appointment | 2026-03-26T14:00
```

#### Required Datetime

```
@datetime! Appointment
@datetime appointment!: Appointment
```

---

### 13. File Upload

Uses markdown link syntax. An empty URL `()` or extension-only URL `(.csv, .xlsx)` signals an upload target (not a hyperlink).

```
[Upload your logo]()
[Upload the data file](.csv, .xlsx)
```

**Semantics:**

- `()` — any file type.
- `(.ext, .ext)` — restricts to specified extensions. The file picker filters accordingly.

With explicit ID:

```
[report: Upload the report](.pdf)
```

#### Required File Upload

```
[! Upload your logo]()
[report!: Upload the report](.pdf)
```

---

### 14. Image Upload

Uses markdown image syntax. An empty URL `()` signals an upload target.

```
![Upload a photo of the issue]()
```

**Semantics:** Image-only upload. Triggers camera + gallery on mobile.

With explicit ID:

```
![photo: Upload a photo]()
```

#### Required Image Upload

```
![! Upload a photo]()
![photo!: Upload a photo]()
```

**Parsing note:** `![` is a two-character prefix for image upload. `!` followed by any character other than `[` is prose text.

---

### 15. Layout Group

Groups related fields together as a layout hint. The renderer may place grouped fields side-by-side on wider screens.

```
{ name_fields
> first_name: First name
> last_name: Last name
}
```

**Rules:**

- `{` opens a group. An optional name after `{` is used for debugging and accessibility, not for submission.
- `}` closes the group. Must be on its own line.
- Groups do not nest.
- Groups do not affect submission format — each field inside submits independently.
- Groups cannot contain `#` headers, `---` dividers, or prose text. These structural elements should stay top-level.

**Renderer behavior:**

| Screen size | Group layout |
|-------------|--------------|
| Compact (small phone) | Ignored — fields stack vertically as usual |
| Medium (large phone / small tablet) | 2-column grid within the group container |
| Expanded (tablet / desktop+) | 2-column or 3-column based on field count |

See §3.3 for detailed adaptive layout rules.

---

### 16. Inline Hint / Description

Add a description line directly below any block element using `//`.

```
Shipping speed
- Express (2-3 business days)
- Standard (5-7 business days)
- Economy (10-14 business days)
// Shipping speed affects total cost.
```

**Semantics:** Subtle helper text displayed below the parent block.

Multiple consecutive `//` lines are concatenated:

```
// Line one of the hint.
// Line two of the hint.
```

---

### 17. Divider

Separates logical groups visually.

```
---
```

---

### Icons

Icons can appear as leading characters in any label or option text. The renderer extracts and resolves them. Two forms are supported:

**Leading symbol (emoji, special character, 한글, etc.):**

```
Travel mode
- 🚗 Drive
- 🚆 Train
- ✈️ Fly

# ⚙️ Settings
```

**Named icon (`:name:` syntax):**

```
Travel mode
- :car: Drive
- :train: Train
- :plane: Fly
```

**Resolution chain (renderer-owned):**

The renderer resolves icons in priority order:

1. **Leading symbol** — extract the first character if it's an emoji, special character (★, ♦, Ω), or non-ASCII character (한글, etc.). The renderer decides whether to display, replace, or ignore it.
2. **Named icon (`:name:`)** — look for a matching asset file (SVG, PNG) in the renderer's icon directory.
3. **Icon library fallback** — if no asset found, try the renderer's icon library (e.g., Font Awesome, Material Icons, SF Symbols).
4. **Graceful fallback** — if nothing resolves, display the text as-is (`:name:` stays as plain text, symbols stay as characters).

**Key principle:** Icon resolution is entirely a renderer concern. The parser does not interpret icons — they are inline text. Different renderers can map the same `:name:` to different platform-native icons.

**Common icon names:**

Renderers are encouraged to support this common vocabulary:

`home`, `search`, `settings`, `edit`, `delete`, `add`, `close`, `check`,
`email`, `phone`, `chat`, `person`, `lock`, `key`,
`file`, `folder`, `image`, `camera`, `upload`, `download`,
`star`, `heart`, `flag`, `info`, `warning`, `error`, `success`,
`calendar`, `clock`, `location`, `globe`,
`cart`, `payment`, `money`, `gift`,
`car`, `train`, `plane`, `bus`, `bike`

---

## Token Priority Table

The parser matches line prefixes in **priority order**. Higher-priority patterns are tested first. This resolves ambiguities when multiple patterns could match.

| Priority | Pattern | Block Type | Notes |
|----------|---------|------------|-------|
| 1 | `---` | Divider | Exactly three hyphens (or more) |
| 2 | `##` | Subsection header | Must match before `#` |
| 3 | `#` | Section header | |
| 4 | `//` | Hint | |
| 5 | `![...]()` | Image upload | `![` is a 2-char prefix; distinguishes from `!` + prose |
| 6 | `- [x]` / `- [ ]` | Multi-select option | Dash + space + bracket with `x` or space + bracket |
| 7 | `[...]()` | File upload | Only if parens are empty or contain extensions only; otherwise prose (markdown link) |
| 8 | `>>` | Multi-line text input | Must match before `>` |
| 9 | `>` | Single-line text input | |
| 10 | `?!` | Confirmation | |
| 11 | `~` | Slider / range | |
| 12 | `@datetime` | Datetime picker | Must match before `@date` and `@time` |
| 13 | `@date` | Date picker | |
| 14 | `@time` | Time picker | |
| 15 | `@email` | Typed input (email) | Must match before generic `@` prose |
| 16 | `@tel` | Typed input (tel) | |
| 17 | `@url` | Typed input (url) | |
| 18 | `@number` | Typed input (number) | |
| 19 | `@password` | Typed input (password) | |
| 20 | `@color` | Typed input (color) | |
| 21 | `{` | Group start | |
| 22 | `}` | Group end | |
| 23 | `N.` (digit + dot) | Sequence option | Any `digit(s).` pattern |
| 24 | `- ` (dash + space, not `- [x]`/`- [ ]`) | Single-select option | Already distinguished from multi-select at priority 6 |
| 25 | _label line_ | Select / sequence label | Lookahead: only if the next line starts with `-`, `- [x]`, `- [ ]`, or `N.` |
| 26 | _(anything else)_ | Prose | Fallback |

**Key conflict resolutions:**

- `---` before `- ` — divider takes precedence over single-select option.
- `##` before `#` — longest prefix match.
- `>>` before `>` — longest prefix match.
- `@datetime` before `@date` / `@time` — longest prefix match.
- `@email` / `@tel` / `@url` / `@number` / `@password` / `@color` — typed inputs, same `@` prefix family as temporal pickers; matched after `@time`.
- `![...]()` before `!` + prose — 2-char `![` prefix check.
- `- [x]` / `- [ ]` before `- text` — multi-select (priority 6) checked before single-select (priority 18).
- `[...]()` (file upload) vs `[text](url)` (prose link) — parens content inspection: empty or extensions only → upload; real URL → prose.
- Label line (priority 19) requires **one-line lookahead** — the parser peeks at the next line to determine if the current line is a select/sequence label or prose.

### Required (`!`) Detection

After the prefix is matched, the parser checks for `!` in the appropriate position:

| Block Type | `!` Position |
|------------|-------------|
| Text input | On prefix: `>!`, `>>!`. Or on ID: `> id!: label` |
| Date/Time/Datetime | On prefix: `@date!`. Or on ID: `@date id!: label` |
| Typed input | On prefix: `@email!`. Or on ID: `@email id!: label` |
| File upload | Inside brackets: `[! label]()` or `[id!: label]()` |
| Image upload | Inside brackets: `![! label]()` or `![id!: label]()` |
| Single-select | On label line: `Label!` or `id!: Label` |
| Multi-select | On label line: `Label!` or `id!: Label` |

### ID Extraction

After prefix and `!` detection, the parser extracts the explicit ID:

- If the text matches `[a-z][a-z0-9_]*!?:\s+`, the portion before `:` (excluding `!`) is the explicit ID.
- The remaining text after `: ` is the display label.
- If no explicit ID is found, the display label is used for auto-derivation.

---

## Grouping Rules

1. Consecutive lines of the **same block type** are grouped into a single component (e.g., multiple `- [x]` lines → one checkbox group, multiple `- ` lines → one radio group, multiple `N.` lines → one sequence).
2. A **blank line** or a **different block type** ends the current group.
3. Two consecutive groups of the same type **must** be separated by a different block type (header, hint, divider, prose, or label line). Otherwise the parser merges them.
4. `//` hint lines attach to the **immediately preceding** block. They do not start a new group.
5. `{` and `}` lines are structural delimiters. They do not participate in block grouping.
6. A **label line** is consumed as part of the following select/sequence group, not as a standalone block.

---

## Escaped Characters

If a line begins with a markdown2ui prefix but is intended as prose, escape the prefix with `\`:

```
\# This is not a header
\> This is not an input field
\- This is not a select option
\![This is not an image upload]()
```

Characters that require escaping at line start: `#`, `>`, `?`, `~`, `@`, `[`, `{`, `}`, `!`, `-`, `1.`–`99.`

---

## Composite Example

```
# 호텔 찾아줄게

{ date_range
@date checkin: 체크인 날짜 | 2026-03-26
@date checkout: 체크아웃 날짜
}

~ budget: 1박 예산 [50000 - 500000] (150000) %10000
// 단위: 원

region: 선호 지역
- 삿포로역 근처
- 스스키노 (default)
- 오도리공원 근처

conditions: 필요 조건
- [x] 금연
- [ ] 조식 포함
- [ ] 대욕장
- [ ] 1인실

site!: 예약 사이트
- 최저가 아무 데나
- 아고다
- 부킹닷컴
- 트립닷컴

priority: 우선순위 정렬
1. 가격
2. 위치
3. 리뷰 평점
4. 청결도

![receipt: 영수증 사진]()
```

Submitted (compact):

```
[checkin] 2026-03-26
[checkout] 2026-03-28
[budget] 150000
[region] 스스키노
[conditions] 금연
[site] 최저가 아무 데나
[priority] 위치, 가격, 리뷰 평점, 청결도
[receipt] receipt_photo.jpg
```

---

## Streaming Behavior

Since LLM responses stream token-by-token:

1. The parser buffers the current line.
2. On newline (`\n`), it classifies the completed line and begins rendering the appropriate component.
3. If the next line continues the same group (e.g., another `- [x]`), the component expands.
4. If the next line is a different type, the previous component is finalized.
5. Prose lines are rendered as text immediately.
6. `{` opens a group container. The renderer holds layout decisions until `}` is received.
7. A label line is held until the next line confirms it as a select/sequence label (via lookahead). If the next line is not a select/sequence option, the label line is emitted as prose.

---

## Edge Cases

1. **Empty single-select:** Submit the pre-selected default.
2. **Empty multi-select:** Valid (unless `!` required). Submit as empty string.
3. **Freestyle overrides (single-select):** Freestyle text replaces the selected option. Not available if `!` is set.
4. **Freestyle appends (multi-select):** Freestyle text is added alongside checked items.
5. **Nested blocks:** Not supported. All blocks are top-level only (except within `{ }` groups, which are a layout mechanism, not semantic nesting).
6. **Maximum options:** No hard limit, but agents should keep single-select ≤ 7, multi-select ≤ 12, and sequence ≤ 10 for usability. The renderer adapts to larger lists automatically (see §3.2).
7. **Mixed content:** Prose text (lines not matching any prefix) is rendered as rich text between UI blocks.
8. **Prose Markdown:** Prose sections support standard Markdown rendering (bold, italic, code, links). The client routes prose lines through a Markdown renderer. Note: markdown links `[text](url)` in prose are rendered as hyperlinks, not file uploads — the parser distinguishes these by checking if the URL is empty or extension-only.
9. **ID collision:** If auto-derived IDs collide, the parser appends `_2`, `_3`, etc.
10. **Required fields:** Submit is disabled until all required fields are satisfied.
11. **Unclosed groups:** If `{` has no matching `}`, the group extends to the end of the form.
12. **Label line without following select/sequence:** If a label line is not followed by select/sequence options, it is rendered as prose.
13. **Date/time/datetime without default:** Initializes to the current date/time (`now`).
14. **Confirmation ternary parsing failure:** If the ` ? ... : ...` pattern cannot be parsed, treat the entire text after `?!` as the question with default Yes/No labels.
15. **Sequence with repeated numbers:** Accepted. Parser assigns order by appearance, ignoring actual number values.
16. **Footnotes:** `[^N]` footnote references and `[^N]:` definitions in prose are passed through to the prose Markdown renderer. If the renderer supports footnotes, they are displayed as disclaimers/fine print at the bottom of the form.

---

---

# Part 2: System Prompt

Two prompt tiers are provided. The client injects the appropriate tier based on the platform and agent profile.

## Tier 1: Compact Prompt (~400 tokens)

For conversational agents, desktop/web-only, text-heavy workflows.

```
<markdown2ui>
When you need input from the user, use markdown2ui syntax. The client renders
native interactive components from this markup.

Syntax:
- Radio (one):        Label line, then: - Option A  /  - Option B  /  - Option C
  First = default. Override: add (default) to another.
  Label with ID:     lang: Preferred language
- Checkbox (many):   Label line, then: - [x] Pre-selected  /  - [ ] Unselected
- Sequence (order):  Label line, then: 1. Item  /  2. Item  /  3. Item
  User drags to reorder.
- Confirm:           ?! Question  (No = default, Yes = confirm action)
  Custom labels:     ?! Question ? Yes label : No label
- Text:              > Single line  /  >> Multi-line
  Placeholder:       > Question | hint text
  Pre-fill:          > Question || value
  Required:          >! Question  /  >> id!: Question
- Typed input:       @email / @tel / @url / @number / @password / @color
  Same |, ||, ! syntax as text. E.g.: @email! user_email: Email | user@example.com
- Header:            # Section  /  ## Subsection
- File upload:       [Label]()  /  [Label](.csv, .xlsx)
- Image upload:      ![Label]()
- Hint:              // Appears below previous block
- Divider:           ---
- Group (layout):    { name  ...fields...  }
- ID (optional):     > my_id: Label  — stable submission key
- Required:          Add ! to ID (id!:) or prefix (>!) or label (Label!)

Rules:
1. Prefer markdown2ui over plain text for user input.
2. Group related questions in one block to minimize round-trips.
3. Pre-select recommended options. Pre-fill text fields when you can infer values.
4. Use (default) only when the first option is NOT the best default.
5. Keep labels concise. Use // for extra context.
6. Select blocks auto-include a freestyle input — use ! to disable it.
7. Prose before/after markdown2ui blocks is fine — client renders it as text.
8. Use { } to group related fields the renderer may lay out side-by-side.
9. Use conditional logic across turns, not within a single form.
10. Use @email/@tel/@url/@number/@password/@color for typed inputs instead of plain text.
11. Use :icon_name: or leading emoji for visual icons in labels and options.
</markdown2ui>
```

## Tier 2: Full Prompt (~550 tokens)

For mobile apps, TV/d-pad, form-heavy agents, scheduling/file workflows.

```
<markdown2ui>
When you need input from the user, use markdown2ui syntax. The client renders
native interactive components from this markup.

Syntax:
- Radio (one):        Label line, then: - Option A  /  - Option B  /  - Option C
  First = default. Override: add (default) to another.
  Label with ID:     lang: Preferred language
- Checkbox (many):   Label line, then: - [x] Pre-selected  /  - [ ] Unselected
- Sequence (order):  Label line, then: 1. Item  /  2. Item  /  3. Item
  User drags to reorder.
- Confirm:           ?! Question  (No = default, Yes = confirm action)
  Custom labels:     ?! Question ? Yes label : No label
- Text:              > Single line  /  >> Multi-line
  Placeholder:       > Question | hint text
  Pre-fill:          > Question || value
  Required:          >! Question  /  >> id!: Question
- Typed input:       @email / @tel / @url / @number / @password / @color
  Same |, ||, ! syntax as text. E.g.: @email! user_email: Email | user@example.com
  Format on @number: @number price: Price @currency(USD)
- Header:            # Section  /  ## Subsection
- Slider:            ~ Label [min - max] (default)
  Step size:         ~ Label [min - max] (default) %step
  Format:            ~ Label [min - max] (default) %step @currency(KRW)
- Format annotations (display-only, on @number and ~ slider):
  @currency(CODE)    ISO 4217, locale-aware
  @unit(text)        suffix, e.g. @unit(kg). Plural: @unit(star|stars)
  @percent           percentage display
  @integer           no decimals
  @decimal(N)        fixed N decimal places
- Date picker:       @date Label  (defaults to today)
  With default:      @date Label | YYYY-MM-DD
- Time picker:       @time Label  (defaults to now)
  With default:      @time Label | HH:MM
- Datetime picker:   @datetime Label  (defaults to now)
  With default:      @datetime Label | YYYY-MM-DDTHH:MM
- File upload:       [Label]()  /  [Label](.csv, .xlsx)
- Image upload:      ![Label]()
- Hint:              // Appears below previous block
- Divider:           ---
- Group (layout):    { name  ...fields...  }
- ID (optional):     > my_id: Label  — stable submission key
- Required:          Add ! to ID (id!:) or prefix (>!) or label (Label!)

Rules:
1. Prefer markdown2ui over plain text for user input.
2. Group related questions in one block to minimize round-trips.
3. Pre-select recommended options. Pre-fill text fields when you can infer values.
4. Use (default) only when the first option is NOT the best default.
5. Keep labels concise. Use // for extra context.
6. Select blocks auto-include a freestyle input — use ! to disable it.
7. Use @date/@time/@datetime instead of text inputs for temporal values.
8. Use ~ slider for numeric values with a known range.
9. Use @email/@tel/@url/@number/@password/@color for typed inputs.
10. Use @currency/@unit/@percent on sliders and @number for display formatting.
11. Use ![Label]() when you need a photo from the user (enables camera on mobile).
12. Prose before/after markdown2ui blocks is fine — client renders it as text.
13. Use { } to group related fields the renderer may lay out side-by-side.
14. Use conditional logic across turns, not within a single form.
15. Use :icon_name: or leading emoji for visual icons in labels and options.
</markdown2ui>
```

### Prompt Selection Logic

| Condition | Tier |
|-----------|------|
| Platform is mobile or TV | Tier 2 (Full) |
| Agent profile includes scheduling, file handling, or forms | Tier 2 (Full) |
| Desktop/web conversational agent | Tier 1 (Compact) |
| Token budget is critical (very long system prompt) | Tier 1 (Compact) |

---

---

# Part 3: UI Renderer Specification

The renderer is the client-side engine that transforms parsed markdown2ui blocks into native interactive components. The renderer is **adaptive** — it makes all layout decisions based on content, screen size, input modality, and platform conventions.

**Cardinal rule:** The LLM controls semantics and defaults. The renderer controls presentation.

**Numeric values in this section** (dp measurements, durations, thresholds) are **recommended defaults**. Each renderer should follow its platform's design system conventions and adjust values as appropriate. The spec defines _what_ adapts and _why_, not exact pixel values.

---

## 3.1 Renderer Architecture

```
markdown2ui Renderer Pipeline

Stream Input (token-by-token)
    │
    ▼
┌──────────────────┐
│  Line Buffer     │  Accumulates tokens until newline
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Line Classifier │  Matches prefix by priority order (§ Token Priority)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  ID / Required   │  Extracts explicit id:, detects ! modifier
│  Extractor       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Label Resolver  │  Handles select/sequence label lookahead
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Block Grouper   │  Groups consecutive same-type lines into one block
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Block Merger    │  Consolidates adjacent related blocks
│                  │  (e.g., 2× @date → date range)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Freestyle       │  Appends text input to select blocks
│  Injector        │  (skipped if block is required !)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Group Resolver  │  Wraps { } delimited blocks into
│                  │  layout group containers
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Layout Engine   │  Decides inline vs. stacked, chip vs. list,
│                  │  column layout, group column distribution
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Component       │  Maps semantic blocks to platform-native
│  Factory         │  components
└──────┬───────────┘
       │
       ▼
  Native UI Output
```

---

## 3.2 Component Rendering Rules

Each block type maps to a native component. The following defines the semantic-to-visual mapping and the adaptive rules for each.

### 3.2.1 Single-Select (Radio)

**Input:** Label line + dash-prefixed options (e.g., `- Option A`)

**Component:** Segmented button group, radio list, chip row, or searchable dropdown — chosen adaptively.

**Layout rules:**

| Condition | Layout |
|-----------|--------|
| 2–3 options, all labels ≤ threshold¹ | **Inline chip row** — single horizontal row, all options in one connected rounded rectangle. Each chip is a tap target. Selected chip is filled; others are outlined. |
| 2–3 options, any label > threshold¹ | **Stacked chip column** — vertical stack, one option per row. All options sit inside one rounded rectangle container with internal dividers. All rows equal width (match widest). |
| 4–7 options | **Stacked radio list** — vertical list with radio indicators on the leading edge. All options inside one container with internal dividers. |
| 8–15 options | **Scrollable radio list with search filter** — same as stacked, with max-height, internal scroll, and a compact filter text field at the top (_"Filter..."_). |
| > 15 options | **Searchable dropdown** — collapsed by default showing the selected value. Expands on tap to a filterable list. |

¹ Threshold is platform-dependent. See §3.3.2.

**Search filter behavior (8+ options):**

- Compact text field at the top of the scrollable area with placeholder: _"Filter..."_
- Filters options by case-insensitive substring match.
- Non-matching options are hidden, not disabled.
- Clearing the filter restores all options.
- The filter is purely visual — it does not affect the markup or submission format.

**Freestyle attachment:** A compact single-line text field is rendered below the last option, inside the same container. Placeholder: _"Or type your answer..."_ **Not rendered if the block is required (`!`).**

**Pre-selection:** The option marked `(default)` or the first option (if no explicit default) renders in the selected state on mount.

**Label:** The label line text is rendered as a field label above the options container.

**Container:** Label + all options + freestyle input (if applicable) are wrapped in a single rounded rectangle container.

---

### 3.2.2 Multi-Select (Checkbox)

**Input:** Label line + task-list options (e.g., `- [x] Option A`)

**Component:** Checkbox list, chip grid, or searchable multi-select — chosen adaptively.

**Layout rules:**

| Condition | Layout |
|-----------|--------|
| 2–4 options, all labels ≤ threshold¹ | **Inline chip row** — horizontal, multi-selectable. Selected chips are filled; unselected are outlined. Wraps to second row if needed. |
| 5–12 options, all labels ≤ threshold¹ | **Chip grid** — wrapping flow layout. Chips auto-wrap based on container width. |
| Any option label > threshold¹ | **Stacked checkbox list** — vertical list with checkboxes on the leading edge. Full container width. Internal dividers. |
| 13–20 options | **Scrollable checkbox list with search filter** — max-height with internal scroll and a compact filter text field. |
| > 20 options | **Searchable multi-select dropdown** — collapsed by default showing selected values as chips/tags. Expands to a filterable checklist. |

¹ Threshold is platform-dependent. See §3.3.2.

**Freestyle attachment:** Compact text field below, inside same container. Placeholder: _"Or add your own..."_

**Pre-selection:** Options marked `- [x]` render in checked state on mount.

**Label:** The label line text is rendered as a field label above the options container.

**Container:** Same single rounded rectangle as single-select.

---

### 3.2.3 Sequence (Reorderable List)

**Input:** Label line + numbered options (e.g., `1. Item`)

**Component:** Vertical list with drag handles.

**Layout:**

- Label text above the list.
- Each item is a row with a **drag handle** (grip icon) on the leading or trailing edge.
- Items are displayed in their initial order (by appearance in markup).
- No selection state — all items are always present.

**Interaction model:**

| Modality | Reorder mechanism |
|----------|-------------------|
| **Touch (mobile)** | Long-press an item, then drag to reposition. Drop zones highlighted during drag. |
| **Pointer (desktop)** | Click and drag the handle. Or click an item, then use up/down arrow keys. |
| **D-pad / Remote (TV)** | Focus an item, press select to "pick up", use up/down to move, press select again to "drop". |
| **Keyboard (desktop)** | Focus an item, Space/Enter to pick up, arrow keys to move, Space/Enter to drop. |

**Visual feedback:**

- Dragged item is elevated (shadow/scale) and partially transparent at its original position.
- Drop target position is indicated by a gap or insertion line.
- On drop, items animate to their new positions (recommended ~`200ms` ease-out).

**Container:** Single rounded rectangle wrapping label + all items.

---

### 3.2.4 Confirmation

**Input:** `?!` prefix.

**Component:** Inline button pair.

**Layout:**

- Question text is rendered as a label above the buttons.
- Two buttons side-by-side: **[No]** (primary/filled, default) and **[Yes]** (secondary/outlined).
- If custom labels are provided via ternary syntax, use those instead of "Yes"/"No".
- Buttons are equal width, horizontally centered, with appropriate spacing between them.

**TV/D-pad:** No button (primary) has initial focus.

---

### 3.2.5 Text Input

**Input:** `>` or `>>`

**Single-line (`>`):**

- `OutlinedTextField` (or platform equivalent) with the question text as a floating label.
- Placeholder text (from `|`) shown inside the field when empty.
- Pre-filled value (from `||`) is set as the initial editable value.

**Multi-line (`>>`):**

- Multi-line text field, minimum 3 visible lines.
- Expands vertically as the user types, up to a renderer-defined max-height.

**Required indicator (`!`):**

- A visual indicator (e.g., asterisk, "Required" caption) is shown alongside the label.
- Submit is disabled until the field has a non-empty value.
- See §3.7 Validation.

---

### 3.2.6 Section Header

**Input:** `#` or `##`

**`#` Header:**

- `titleMedium` typography (or platform equivalent).
- Bold weight.
- Top margin recommended: ~`16dp`. No top margin if it's the first block.
- Bottom margin recommended: ~`8dp`.

**`##` Subheader:**

- `titleSmall` typography.
- Medium weight.
- Top margin recommended: ~`12dp`. Bottom margin recommended: ~`4dp`.

Headers are non-interactive. They act as visual group separators and semantic labels for the blocks that follow.

---

### 3.2.7 Slider / Range

**Input:** `~ Label [min - max] (default)` with optional `%step`

**Component:** Native slider with numeric readout.

**Layout:**

- Label text above the slider.
- Slider track with min label on the left, max label on the right.
- Current value displayed as a prominent numeric readout (above thumb or in a tooltip/bubble).
- If `%step` is defined, the slider snaps to increments.
- The `//` hint (if present) renders below the slider.

**Container:** Single rounded rectangle wrapping label + slider + readout + hint.

**TV/D-pad:** Left/right d-pad adjusts the value by one step (or 1 if no step defined). Long-press or hold accelerates.

---

### 3.2.8 Date Picker

**Input:** `@date Label`

**Component:** Platform-native date picker.

**Interaction model:**

- A tap target (button-style or outlined field) showing the label and current value.
- Tapping opens the platform's native date picker:
  - **Mobile:** Modal bottom sheet or fullscreen dialog.
  - **Desktop:** Popover calendar.
  - **TV:** Fullscreen overlay with scrollable year/month/day spinners.
- Default: the provided `| YYYY-MM-DD` value, or **today** if none provided.
- Display format is localized (e.g., `2026년 3월 26일` for ko-KR, `Mar 26, 2026` for en-US).

**Submission format:** Always `YYYY-MM-DD` regardless of display locale.

**This is a distinct component from Time Picker and Datetime Picker.** It shows only a calendar/date selection UI with no time component.

---

### 3.2.9 Time Picker

**Input:** `@time Label`

**Component:** Platform-native time picker.

**Interaction model:**

- Same tap-target pattern as date picker.
- Opens platform time picker:
  - **Android:** Clock face dialog.
  - **iOS:** Scroll wheel.
  - **Web:** `<input type="time">` or custom clock widget.
  - **TV:** Spinner with hour and minute columns.
- Default: the provided `| HH:MM` value, or **current time** if none provided.
- Display format is localized (e.g., `오후 2:00` for ko-KR, `2:00 PM` for en-US).

**Submission format:** Always `HH:MM` (24-hour) regardless of display locale.

**This is a distinct component from Date Picker.** It shows only a time selection UI with no calendar.

---

### 3.2.10 Datetime Picker

**Input:** `@datetime Label`

**Component:** Combined date and time picker.

**Interaction model:**

- A single tap target showing both date and time values.
- Tapping opens a **two-step sequential picker**: date selection first, then time selection. Or a combined picker if the platform provides one natively.
- Default: the provided `| YYYY-MM-DDTHH:MM` value, or **now** if none provided.

**Submission format:** Always `YYYY-MM-DDTHH:MM`.

**This is a distinct component from Date Picker and Time Picker.** It collects both date and time in a single block.

---

### 3.2.11 File Upload

**Input:** `[label]()` or `[label](.ext, .ext)`

**Component:** Upload button area.

**Layout:**

- A dashed-outline rectangular area with an upload icon and the label text.
- Tapping triggers the system file picker. If extension filter is provided, the picker restricts selection.
- After selection, the area shows filename + file size with a remove/replace button.

**Required indicator (`!`):** Visual indicator that upload is mandatory. Submit disabled until a file is provided.

---

### 3.2.12 Image Upload

**Input:** `![label]()`

**Component:** Upload button area with camera support.

**Layout:**

- Same dashed-outline area as file upload, but with an image/camera icon.
- Tapping triggers camera + gallery action sheet on mobile, file picker (image filter) on desktop.
- After selection, the area shows a thumbnail preview with a remove/replace button.

**Required indicator (`!`):** Visual indicator that upload is mandatory. Submit disabled until an image is provided.

**TV/D-pad:** Focus highlights the upload area. Select button opens a file browser overlay.

---

### 3.2.13 Layout Group

**Input:** `{` to open, `}` to close.

**Component:** A transparent container that influences layout but has no visual border of its own.

**Layout:**

| Screen size | Group behavior |
|-------------|----------------|
| Compact (small phone) | Ignored — fields stack vertically as usual |
| Medium (large phone / small tablet) | 2-column grid within the group |
| Expanded (tablet / desktop+) | 2-column or 3-column based on field count |

**Rules:**

- Fields within a group share a single visual container on wider screens.
- The group name (if provided) is used as an `aria-label` / `contentDescription` for accessibility, not displayed visually.
- During streaming, the renderer holds layout decisions for grouped fields until `}` is received, then renders the group as a unit.

---

### 3.2.14 Hint

**Input:** `//`

**Component:** Caption text.

**Layout:**

- `bodySmall` or `caption` typography.
- `onSurfaceVariant` color (muted).
- Attached directly below the preceding block's container with recommended ~`4dp` spacing.
- Multiple consecutive `//` lines are concatenated into one hint.
- Does not have its own container — it belongs to the block above.

---

### 3.2.15 Divider

**Input:** `---`

**Component:** Horizontal rule.

**Layout:**

- Thin line (`1dp` or `hairline`).
- `outlineVariant` color.
- Top and bottom margin recommended: ~`12dp`.
- Full width of the form container.

---

### 3.2.16 Prose

**Input:** Any line that does not match a markdown2ui prefix.

**Component:** Rich text.

**Layout:**

- Rendered through a standard Markdown renderer (supports bold, italic, code, links, inline code, footnotes).
- Markdown links `[text](url)` in prose render as hyperlinks (not upload targets).
- `bodyMedium` typography.
- Normal text color (`onSurface`).
- Consecutive prose lines are merged into a single paragraph.
- A blank line between prose lines creates a paragraph break.
- Footnote definitions (`[^N]: text`) render as fine print at the bottom of the form if the renderer supports them.

---

## 3.3 Adaptive Layout Engine

The layout engine adapts component presentation based on runtime context. **The LLM never controls layout.** All decisions below are made by the renderer at render time.

### 3.3.1 Block Merging (Consolidation)

The Block Merger stage detects adjacent blocks that should render as a unified visual unit.

**Date range detection:**

Two consecutive `@date` blocks with no intervening block → render as a single **date range picker** component.

- One container (rounded rectangle) with two date fields side-by-side on wide screens, stacked on narrow screens.
- Labels: leading field uses the first block's label, trailing field uses the second block's label.
- The range picker enforces that end date ≥ start date.
- If violation occurs, inline error text appears below the component.

Example input:

```
@date checkin: Check-in | 2026-03-26
@date checkout: Check-out
```

→ Rendered as one date range component, not two separate pickers.

**Time range detection:**

Two consecutive `@time` blocks → render as a single **time range picker**. Same consolidation logic.

**Datetime range detection:**

Two consecutive `@datetime` blocks → render as a single **datetime range picker**.

**Merging is broken by any intervening block:** If the agent places any other block type between two temporal blocks (including `//` hint, `---` divider, or prose), they render as independent pickers.

**No cross-type merging:** `@date` followed by `@time` does NOT merge into `@datetime`. They remain separate components. The LLM should use `@datetime` explicitly when both are needed in one picker.

---

### 3.3.2 Content-Adaptive Sizing

The renderer measures option label content to decide between inline and stacked layouts.

**Recommended character width thresholds:**

| Platform | Inline max chars/label (single-select) | Inline max options (single-select) | Inline max chars/label (multi-select) | Inline max options (multi-select) |
|----------|----------------------------------------|------------------------------------|---------------------------------------|-----------------------------------|
| Mobile portrait | ~8 | ~3 | ~6 | ~4 |
| Mobile landscape | ~12 | ~4 | ~10 | ~6 |
| Tablet / Desktop | ~16 | ~5 | ~12 | ~8 |
| TV | ~12 | ~4 | ~10 | ~4 |

If **all** labels fit within the character threshold **and** the option count is within the max, the renderer uses an inline chip row. Otherwise, it falls back to a stacked list.

These thresholds are **recommended defaults** and should be adjusted per platform. The renderer should prefer measuring actual rendered text width when possible; character count is a fallback heuristic.

**Sequence blocks** always render as a stacked list (drag-to-reorder requires vertical layout).

---

### 3.3.3 Screen-Size Breakpoints

The spec defines semantic breakpoint names. The recommended width ranges below are advisory — each platform should use its native breakpoint conventions.

| Breakpoint | Recommended range | Behavior |
|------------|-------------------|----------|
| Compact | Small phone portrait | Single column. All blocks stack vertically. Chips wrap aggressively. Groups are ignored (stacked). |
| Medium | Large phone / small tablet | Single column with wider containers. Inline chips fit more. Groups may use 2-column layout. |
| Expanded | Tablet / small desktop | Optional two-column layout for independent block groups separated by `---` dividers. Groups use 2-column layout. |
| Large | Desktop / TV | Two-column with generous padding. Date ranges always render side-by-side. Groups may use 2–3 columns. |

**Column spanning:** Headers (`#`, `##`), dividers (`---`), confirmation (`?!`), and prose always span the full width of the form, regardless of column layout.

---

### 3.3.4 Input Modality Adaptation

| Modality | Adaptations |
|----------|-------------|
| **Touch (mobile)** | Minimum tap target recommended: ~`48dp × 48dp`. Chips have generous padding. Date/time pickers use bottom sheets. File upload opens system share sheet. Sequence items reorder via long-press drag. |
| **Pointer (desktop)** | Smaller hit targets acceptable. Pickers use popovers. Hover states on chips and buttons. Sequence items reorder via drag handle. |
| **D-pad / Remote (TV)** | Visible focus ring on all interactive elements. Focus order follows block order top-to-bottom, left-to-right within inline layouts. Slider responds to left/right d-pad. No button (primary) in confirmation has initial focus. Chip rows navigate with left/right; columns with up/down. Sequence items: select to pick up, d-pad to move, select to drop. |
| **Keyboard (desktop)** | Tab cycles through blocks. Space/Enter toggles selection. Arrow keys navigate within radio/checkbox groups. Sequence items: Space/Enter to pick up, arrow keys to move, Space/Enter to drop. |

---

### 3.3.5 Container Styling

All interactive blocks (single-select, multi-select, sequence, slider, text input, date/time/datetime, file/image upload) are wrapped in a **card container** with consistent styling. Recommended defaults:

| Property | Recommended Value |
|----------|-------------------|
| Background | `surfaceContainerLow` (Material 3) or platform equivalent |
| Border | ~`1dp` solid, `outlineVariant` color |
| Corner radius | ~`12dp` |
| Internal padding | ~`16dp` horizontal, ~`12dp` vertical |
| Spacing between card containers | ~`12dp` |
| Shadow / Elevation | None (flat) or minimal — follow platform convention |

Headers, hints, dividers, and prose are **not** wrapped in card containers. They sit between cards as structural/decorative elements.

Layout groups (`{ }`) do not add their own visual container. They influence column distribution within the existing card styling.

---

### 3.3.6 Form Container

The entire markdown2ui block set in a single agent response is wrapped in a **form container**:

| Property | Recommendation |
|----------|----------------|
| Max width | Platform-appropriate (e.g., narrower on mobile, wider on desktop/TV) |
| Alignment | Leading-aligned within the chat bubble, or full-width if the form is the only response content |
| Background | Transparent (inherits chat/app background) |
| Bottom action | **[Submit]** button — full width, primary filled style |

**Submit button behavior:**

- Always the last element in the form.
- Enabled by default (since all inputs have defaults or are optional) — **unless** required fields (`!`) are unsatisfied or a validation error exists.
- On TV, Submit receives focus after the last interactive block.

---

## 3.4 Theming

The renderer uses the host platform's design system tokens. No hardcoded colors.

### Material 3 (Android)

| Role | Token |
|------|-------|
| Selected chip / radio fill | `primaryContainer` |
| Selected chip text | `onPrimaryContainer` |
| Unselected chip outline | `outline` |
| Container background | `surfaceContainerLow` |
| Hint text | `onSurfaceVariant` |
| Primary button (Submit, No default) | `primary` / `onPrimary` |
| Secondary button (Yes / confirm) | `secondaryContainer` / `onSecondaryContainer` |
| Error text / validation | `error` / `onError` |
| Required indicator | `error` |
| Divider | `outlineVariant` |
| Drag handle (sequence) | `onSurfaceVariant` |

### iOS (Human Interface Guidelines)

Map to system dynamic colors: `tintColor`, `label`, `secondaryLabel`, `tertiarySystemFill`, `separator`, etc. Use `UIColor` / SwiftUI `Color` system variants for automatic dark mode support.

### Web

Expose CSS custom properties:

```css
--m2u-primary
--m2u-on-primary
--m2u-primary-container
--m2u-on-primary-container
--m2u-surface
--m2u-surface-container-low
--m2u-on-surface
--m2u-on-surface-variant
--m2u-outline
--m2u-outline-variant
--m2u-error
--m2u-on-error
```

Default to a neutral light theme. Dark mode support is automatic if tokens are defined for both `prefers-color-scheme` media queries.

---

## 3.5 Animation & Transitions

All durations below are recommended defaults. Renderers should follow platform conventions and respect reduced-motion preferences.

### Streaming Entry

As blocks finalize during streaming, they animate in:

- **Effect:** Fade in (opacity 0 → 1) + slight upward slide.
- **Duration:** Recommended ~`150ms`, ease-out.
- **Stagger:** Each block's animation starts ~`50ms` after the previous block's.

### Selection Feedback

| Interaction | Animation |
|-------------|-----------|
| Chip / radio selection | ~`150ms` fill color transition |
| Checkbox toggle | ~`100ms` checkmark scale-in animation |
| Slider thumb movement | Continuous smooth follow (no animation delay) |
| Button press | Platform-standard press feedback (ripple on Android, highlight on iOS) |
| Sequence item drag | Elevated shadow + slight scale. Other items shift smoothly (~`200ms`). |
| Sequence item drop | Item settles to new position (~`200ms` ease-out). |

### Submit Transition

1. Submit button shows press feedback.
2. The entire form fades out (recommended ~`200ms`).
3. A compact submission summary card fades in, showing the key-value pairs.

### TV Focus

- Focus ring transitions between elements with recommended ~`100ms` ease-in-out.
- Focused element scales up slightly (recommended ~`1.02×`) for visibility at viewing distance.

---

## 3.6 Accessibility

1. **Semantic roles:** Radio groups expose `role=radiogroup`. Checkbox groups expose `role=group` with `role=checkbox` children. Sliders expose `role=slider` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`. Sequence lists expose `role=list` with `aria-roledescription="reorderable list"`.
2. **Labels:** Every interactive component exposes its label text to the accessibility tree via `contentDescription` (Android), `accessibilityLabel` (iOS), or `aria-label` (Web).
3. **Hints:** `//` hint text is associated with the preceding block via `contentDescription` (Android), `accessibilityHint` (iOS), or `aria-describedby` (Web).
4. **Focus order:** Matches visual block order. Freestyle inputs are part of their parent group's focus cycle. Fields within a `{ }` group follow reading order (left-to-right, top-to-bottom within the group grid).
5. **Screen reader announcements:** Confirmation question text is read as context for the button group. Sequence items announce their current position: "Speed, item 1 of 3. Double-tap to pick up and reorder."
6. **Required fields:** Required fields are announced with "required" in the accessibility label. Example: "Company name, required, text field."
7. **Contrast:** All text and interactive elements meet WCAG 2.1 AA contrast ratios using the platform's theme tokens.
8. **Motion reduction:** When `prefers-reduced-motion` is enabled (or platform equivalent), skip streaming entry animations and selection transitions. Sequence reorder uses instant repositioning instead of animated shifts.

---

## 3.7 Validation

The renderer performs client-side validation before allowing submission:

| Block Type | Rule | Error Display |
|------------|------|---------------|
| Single-select | Always valid (has default). | — |
| Single-select (`!`) | Always valid (has default, freestyle disabled). | — |
| Multi-select | Always valid (empty allowed). | — |
| Multi-select (`!`) | At least one option must be selected. | Inline error: _"Select at least one option"_. Submit disabled. |
| Sequence | Always valid (all items present). | — |
| Confirmation | Always valid (must pick one). | — |
| Text input | Always valid (empty allowed). | — |
| Text input (`!`) | Non-empty required. | Inline error: _"This field is required"_. Submit disabled. |
| Slider | Always valid (has default, bounded range). | — |
| Date / Time / Datetime | Always valid (defaults to now). | — |
| Date / Time / Datetime (`!`) | Cannot be cleared. | Inline error if cleared. Submit disabled. |
| Date range (merged) | End date ≥ start date. | Inline error below range component. Submit disabled. |
| File upload | Always valid (optional). | — |
| File upload (`!`) | File must be provided. | Inline error: _"This field is required"_. Submit disabled. |
| Image upload | Always valid (optional). | — |
| Image upload (`!`) | Image must be provided. | Inline error: _"This field is required"_. Submit disabled. |
| File type mismatch | Extension filter validation. | Inline error: _"Unsupported file type. Expected: .csv, .xlsx"_ |
| File size | Platform-defined max (configurable). | Toast or inline: _"File exceeds maximum size."_ |

---

## 3.8 Platform Component Mapping

### Android (Jetpack Compose)

| Block Type | Component |
|------------|-----------|
| Single-select (inline) | `SingleChoiceSegmentedButtonRow` |
| Single-select (stacked) | Custom `RadioGroup` in `Card` |
| Single-select (searchable) | `ExposedDropdownMenuBox` with `TextField` filter |
| Multi-select (chips) | `FlowRow` { `FilterChip` } |
| Multi-select (stacked) | Custom `CheckboxGroup` in `Card` |
| Multi-select (searchable) | `ExposedDropdownMenuBox` with `Checkbox` items |
| Sequence | `LazyColumn` with `detectReorderAfterLongPress` (reorderable modifier) |
| Confirmation | `Row` { `OutlinedButton` ("Yes") + `Button` ("No") } |
| Text input (single) | `OutlinedTextField` |
| Text input (multi) | `OutlinedTextField(singleLine = false, minLines = 3)` |
| Header `#` | `Text(style = MaterialTheme.typography.titleMedium, fontWeight = Bold)` |
| Subheader `##` | `Text(style = MaterialTheme.typography.titleSmall)` |
| Slider | `Slider` + `Text` readout |
| Date picker | `DatePickerDialog` |
| Time picker | `TimePickerDialog` (clock face) |
| Datetime picker | `DatePickerDialog` → `TimePickerDialog` (sequential) |
| Date range (merged) | `DateRangePickerDialog` or two `DatePickerDialog` in one `Card` |
| File upload | `OutlinedButton` + `ActivityResultContracts.GetContent()` |
| Image upload | `OutlinedButton` + `ActivityResultContracts.TakePicturePreview()` / `GetContent("image/*")` |
| Layout group | `Row` / `FlowRow` with `Modifier.weight()` distribution |
| Hint | `Text(style = bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)` |
| Divider | `HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)` |
| Prose | `MarkdownText` composable (via markdown rendering library) |
| Submit | `Button(modifier = Modifier.fillMaxWidth())` |

### iOS (SwiftUI)

| Block Type | Component |
|------------|-----------|
| Single-select (inline) | `Picker` with `.segmented` style |
| Single-select (stacked) | `List` with custom radio row + `selection` binding |
| Multi-select | `List` with `Toggle` rows |
| Sequence | `List` with `.onMove` modifier for drag reorder |
| Confirmation | `HStack` { `Button(.bordered)` ("Yes") + `Button(.borderedProminent)` ("No") } |
| Text input (single) | `TextField` |
| Text input (multi) | `TextEditor` |
| Slider | `Slider(value:in:step:)` |
| Date picker | `DatePicker(displayedComponents: .date)` |
| Time picker | `DatePicker(displayedComponents: .hourAndMinute)` |
| Datetime picker | `DatePicker(displayedComponents: [.date, .hourAndMinute])` |
| File upload | `.fileImporter()` modifier |
| Image upload | `PhotosPicker` |
| Layout group | `HStack` / `LazyVGrid` |

### Web (HTML / CSS / JS)

| Block Type | Component |
|------------|-----------|
| Single-select (inline) | `<div role="radiogroup">` with styled `<label>` buttons |
| Single-select (stacked) | `<fieldset>` + `<input type="radio">` |
| Single-select (searchable) | Custom combobox with `role="listbox"` |
| Multi-select | `<fieldset>` + `<input type="checkbox">` or styled chip `<button>` elements |
| Multi-select (searchable) | Custom multi-select combobox |
| Sequence | `<ul role="list" aria-roledescription="reorderable list">` with drag-and-drop (HTML Drag API or pointer events) |
| Confirmation | Two `<button>` elements |
| Text input (single) | `<input type="text">` |
| Text input (multi) | `<textarea>` |
| Slider | `<input type="range">` with custom CSS + value readout |
| Date picker | `<input type="date">` |
| Time picker | `<input type="time">` |
| Datetime picker | `<input type="datetime-local">` |
| File upload | `<input type="file" accept=".csv,.xlsx">` |
| Image upload | `<input type="file" accept="image/*" capture="environment">` |
| Layout group | CSS Grid or Flexbox container |

### TV (Android TV / Leanback)

Uses the same Compose components as Android with the following overrides:

| Adaptation | Implementation |
|------------|----------------|
| Focus management | `FocusRequester` chain following visual block order |
| Chip navigation | D-pad left/right within row; up/down exits to adjacent block |
| Slider control | D-pad left/right adjusts by step; long-press hold accelerates |
| Sequence reorder | Select to pick up, d-pad up/down to move, select to drop |
| Date/time pickers | Fullscreen overlay with scrollable spinner wheels (year, month, day / hour, minute) |
| Minimum tap target | Recommended ~`48dp` minimum, ~`56dp` for TV viewing distance |
| Submit button | Receives focus after last interactive block via `focusOrder` |

---

## 3.9 Error States

| Error | Behavior |
|-------|----------|
| Required field not satisfied on submit | Inline error text below field. Submit button disabled until resolved. |
| Date range violation (end < start) | Inline error text below range component in `error` color. Submit button disabled until resolved. |
| File type mismatch | Inline error below upload area: _"Unsupported file type. Expected: .csv, .xlsx"_ |
| File too large | Toast notification or inline error. Max size is client-configurable. |
| Network error on upload | Retry button replaces the upload thumbnail. |
| Parser failure (unrecognized line) | Fall back to rendering the line as prose text. **Never crash. Never show raw markup to the user.** |
| Malformed block syntax | Render as prose. Log a parser warning for debugging. |
| Markdown link in prose | `[text](url)` with a real URL renders as a hyperlink, not a file upload. |

---

---

# Part 4: AST Schema

The parser produces a JSON AST (Abstract Syntax Tree) that serves as the contract between the parser and any renderer. This same AST is the SDUI (Server-Driven UI) payload — native clients can consume it directly.

## 4.1 Top-Level Structure

```json
{
  "version": "0.9",
  "blocks": [ ... ]
}
```

- `version` — the markdown2ui spec version used to produce this AST.
- `blocks` — ordered array of block nodes.

## 4.2 Block Node Types

All block nodes share a common base:

```typescript
interface BaseBlock {
  type: string;
  id?: string;        // explicit or auto-derived
  required?: boolean; // true if ! modifier was used
  hint?: string;      // concatenated // hint text, if any
}
```

### SingleSelectBlock

```typescript
interface SingleSelectBlock extends BaseBlock {
  type: "single-select";
  label: string;
  options: SingleSelectOption[];
}

interface SingleSelectOption {
  text: string;
  default: boolean;
}
```

When `required: true`, the freestyle text input is not rendered.

Example:

```json
{
  "type": "single-select",
  "id": "region",
  "label": "선호 지역",
  "options": [
    { "text": "삿포로역 근처", "default": false },
    { "text": "스스키노", "default": true },
    { "text": "오도리공원 근처", "default": false }
  ]
}
```

### MultiSelectBlock

```typescript
interface MultiSelectBlock extends BaseBlock {
  type: "multi-select";
  label: string;
  options: MultiSelectOption[];
}

interface MultiSelectOption {
  text: string;
  selected: boolean; // true if - [x], false if - [ ]
}
```

When `required: true`, at least one option must be selected.

### SequenceBlock

```typescript
interface SequenceBlock extends BaseBlock {
  type: "sequence";
  label: string;
  items: string[]; // ordered by initial appearance
}
```

Example:

```json
{
  "type": "sequence",
  "id": "priority",
  "label": "Arrange by priority",
  "items": ["Speed", "Cost", "Reliability"]
}
```

### ConfirmationBlock

```typescript
interface ConfirmationBlock extends BaseBlock {
  type: "confirmation";
  label: string;      // the question text
  yesLabel: string;    // default "Yes"
  noLabel: string;     // default "No"
}
```

Default is always No. No `default` field needed.

### TextInputBlock

```typescript
interface TextInputBlock extends BaseBlock {
  type: "text-input";
  label: string;
  multiline: boolean;    // true for >>, false for >
  placeholder?: string;  // from | syntax
  prefill?: string;      // from || syntax
}
```

### TypedInputBlock

```typescript
interface TypedInputBlock extends BaseBlock {
  type: "typed-input";
  inputType: "email" | "tel" | "url" | "number" | "password" | "color";
  label: string;
  placeholder?: string;  // from | syntax
  prefill?: string;      // from || syntax
  displayFormat?: FormatAnnotation; // only applicable when inputType is "number"
}
```

### FormatAnnotation

```typescript
type FormatAnnotation =
  | { type: "currency"; code: string }       // @currency(KRW)
  | { type: "unit"; text: string; plural?: string } // @unit(kg) or @unit(star|stars)
  | { type: "percent" }                      // @percent
  | { type: "integer" }                      // @integer
  | { type: "decimal"; places: number };     // @decimal(4)
```

### SliderBlock

```typescript
interface SliderBlock extends BaseBlock {
  type: "slider";
  label: string;
  min: number;
  max: number;
  default: number;
  step?: number;                    // from %step syntax
  displayFormat?: FormatAnnotation; // from format annotation syntax
}
```

### DateBlock

```typescript
interface DateBlock extends BaseBlock {
  type: "date";
  label: string;
  default: string; // YYYY-MM-DD; if not specified in markup, set to today
}
```

### TimeBlock

```typescript
interface TimeBlock extends BaseBlock {
  type: "time";
  label: string;
  default: string; // HH:MM; if not specified in markup, set to current time
}
```

### DatetimeBlock

```typescript
interface DatetimeBlock extends BaseBlock {
  type: "datetime";
  label: string;
  default: string; // YYYY-MM-DDTHH:MM; if not specified in markup, set to now
}
```

### FileUploadBlock

```typescript
interface FileUploadBlock extends BaseBlock {
  type: "file-upload";
  label: string;
  extensions?: string[]; // e.g., [".csv", ".xlsx"]; absent means any file
}
```

### ImageUploadBlock

```typescript
interface ImageUploadBlock extends BaseBlock {
  type: "image-upload";
  label: string;
}
```

### HeaderBlock

```typescript
interface HeaderBlock {
  type: "header";
  level: 1 | 2; // 1 for #, 2 for ##
  text: string;
}
```

### HintBlock

Note: Hints are typically attached to the preceding block's `hint` field during parsing. A standalone `HintBlock` only appears if a `//` line has no preceding interactive block.

```typescript
interface HintBlock {
  type: "hint";
  text: string;
}
```

### DividerBlock

```typescript
interface DividerBlock {
  type: "divider";
}
```

### ProseBlock

```typescript
interface ProseBlock {
  type: "prose";
  text: string; // raw Markdown text
}
```

### GroupBlock

```typescript
interface GroupBlock {
  type: "group";
  name?: string;
  children: Block[]; // the blocks inside { }
}
```

## 4.3 Union Type

```typescript
type Block =
  | SingleSelectBlock
  | MultiSelectBlock
  | SequenceBlock
  | ConfirmationBlock
  | TextInputBlock
  | TypedInputBlock
  | SliderBlock
  | DateBlock
  | TimeBlock
  | DatetimeBlock
  | FileUploadBlock
  | ImageUploadBlock
  | HeaderBlock
  | HintBlock
  | DividerBlock
  | ProseBlock
  | GroupBlock;
```

## 4.4 Full AST Example

For the composite example in Part 1:

```json
{
  "version": "0.9",
  "blocks": [
    {
      "type": "header",
      "level": 1,
      "text": "호텔 찾아줄게"
    },
    {
      "type": "group",
      "name": "date_range",
      "children": [
        {
          "type": "date",
          "id": "checkin",
          "label": "체크인 날짜",
          "default": "2026-03-26"
        },
        {
          "type": "date",
          "id": "checkout",
          "label": "체크아웃 날짜",
          "default": "2026-03-27"
        }
      ]
    },
    {
      "type": "slider",
      "id": "budget",
      "label": "1박 예산",
      "min": 50000,
      "max": 500000,
      "default": 150000,
      "step": 10000,
      "hint": "단위: 원"
    },
    {
      "type": "single-select",
      "id": "region",
      "label": "선호 지역",
      "options": [
        { "text": "삿포로역 근처", "default": false },
        { "text": "스스키노", "default": true },
        { "text": "오도리공원 근처", "default": false }
      ]
    },
    {
      "type": "multi-select",
      "id": "conditions",
      "label": "필요 조건",
      "options": [
        { "text": "금연", "selected": true },
        { "text": "조식 포함", "selected": false },
        { "text": "대욕장", "selected": false },
        { "text": "1인실", "selected": false }
      ]
    },
    {
      "type": "single-select",
      "id": "site",
      "label": "예약 사이트",
      "required": true,
      "options": [
        { "text": "최저가 아무 데나", "default": true },
        { "text": "아고다", "default": false },
        { "text": "부킹닷컴", "default": false },
        { "text": "트립닷컴", "default": false }
      ]
    },
    {
      "type": "sequence",
      "id": "priority",
      "label": "우선순위 정렬",
      "items": ["가격", "위치", "리뷰 평점", "청결도"]
    },
    {
      "type": "image-upload",
      "id": "receipt",
      "label": "영수증 사진"
    }
  ]
}
```

---

---

# Part 5: Submission Format

When the user taps **Submit**, the client serializes the form values. Two formats are available: **compact** and **verbose**. The framework or application chooses which format to use.

## 5.1 Compact Format

A plaintext key-value format optimized for token efficiency when feeding responses back to an LLM.

```
[checkin] 2026-03-26
[checkout] 2026-03-28
[budget] 150000
[region] 스스키노
[conditions] 금연
[site] 최저가 아무 데나
[priority] 위치, 가격, 리뷰 평점, 청결도
[receipt] receipt_photo.jpg
```

**Rules:**

- Keys are the block's ID (explicit or auto-derived).
- Multi-select values are comma-separated.
- Sequence values are comma-separated in the user's final order.
- Freestyle answers appear as the value directly.
- Slider values are numeric.
- Date values use `YYYY-MM-DD`.
- Time values use `HH:MM`.
- Datetime values use `YYYY-MM-DDTHH:MM`.
- File/image upload values contain the file name(s).
- Confirmation values are `Yes` or `No` (or custom labels if ternary was used).
- Empty multi-select submits as empty string.
- Fields with no user-provided value submit as `null`.
- On single-select, if the user deselects all options and submits without freestyle text, the pre-selected default is submitted.
- **All fields are always present**, including fields that have no value. This ensures consistent schema across submissions.

## 5.2 Verbose Format

A structured JSON format that includes full metadata about each field. Useful for agent-to-agent pipelines, logging, form analytics, and building tabular datasets from repeated submissions.

```json
{
  "checkin": {
    "type": "date",
    "label": "체크인 날짜",
    "value": "2026-03-26"
  },
  "checkout": {
    "type": "date",
    "label": "체크아웃 날짜",
    "value": "2026-03-28"
  },
  "budget": {
    "type": "slider",
    "label": "1박 예산",
    "value": 150000,
    "range": [50000, 500000],
    "step": 10000
  },
  "region": {
    "type": "single-select",
    "label": "선호 지역",
    "value": "스스키노",
    "options": ["삿포로역 근처", "스스키노", "오도리공원 근처"]
  },
  "conditions": {
    "type": "multi-select",
    "label": "필요 조건",
    "value": ["금연"],
    "options": [
      { "text": "금연", "selected": true },
      { "text": "조식 포함", "selected": false },
      { "text": "대욕장", "selected": false },
      { "text": "1인실", "selected": false }
    ]
  },
  "site": {
    "type": "single-select",
    "label": "예약 사이트",
    "value": "최저가 아무 데나",
    "options": ["최저가 아무 데나", "아고다", "부킹닷컴", "트립닷컴"]
  },
  "priority": {
    "type": "sequence",
    "label": "우선순위 정렬",
    "value": ["위치", "가격", "리뷰 평점", "청결도"],
    "items": ["가격", "위치", "리뷰 평점", "청결도"]
  },
  "receipt": {
    "type": "image-upload",
    "label": "영수증 사진",
    "value": "receipt_photo.jpg"
  }
}
```

**Verbose value types:**

| Block Type | `value` type |
|------------|-------------|
| Single-select | `string` — the selected option text, or freestyle text |
| Multi-select | `string[]` — array of selected option texts + freestyle text if any |
| Sequence | `string[]` — ordered array of items in the user's final order |
| Confirmation | `boolean` — `true` for Yes, `false` for No |
| Text input | `string` — the entered text |
| Slider | `number` — the numeric value |
| Date | `string` — `YYYY-MM-DD` |
| Time | `string` — `HH:MM` |
| Datetime | `string` — `YYYY-MM-DDTHH:MM` |
| File upload | `string` — filename, or `string[]` if multiple files |
| Image upload | `string` — filename |

**Verbose metadata fields by block type:**

| Block Type | Additional fields |
|------------|-------------------|
| Single-select | `options: string[]` |
| Multi-select | `options: {text: string, selected: boolean}[]` |
| Sequence | `items: string[]` (initial order, for comparison with value) |
| Slider | `range: [number, number]`, `step?: number` |
| Date / Time / Datetime | _(none beyond value and label)_ |
| File upload | `extensions?: string[]` |
| Image upload | _(none beyond value and label)_ |
| Text input | `multiline: boolean` |
| Confirmation | `yesLabel?: string`, `noLabel?: string` (only if custom) |

**Common fields (all types):**

- `type` — the block type string.
- `label` — the display label.
- `value` — the user's selection/input. `null` if the field has no value.
- `hint?` — the hint text, if any.

**All fields are always present in the output**, regardless of whether the user interacted with them. Fields left blank or not applicable use `null` as the value. This guarantees a consistent schema shape across multiple submissions of the same form.

---

---

# Appendices

## Appendix A: Parser Pseudocode

```
function parse(stream: TokenStream) -> AST:
    blocks = []
    currentGroup = null
    groupStack = null
    lineBuffer = ""
    pendingLabel = null

    for token in stream:
        lineBuffer += token

        if not lineBuffer.endsWith("\n"):
            continue

        line = lineBuffer.trim()
        lineBuffer = ""

        // Resolve pending label
        if pendingLabel != null:
            type = classifyByPriority(line)
            if type == SINGLE_SELECT_OPTION or type == MULTI_SELECT_OPTION
               or type == SEQUENCE_OPTION:
                currentGroup = new BlockGroup(type, line)
                currentGroup.label = pendingLabel.label
                currentGroup.id = pendingLabel.id
                currentGroup.required = pendingLabel.required
                pendingLabel = null
                continue
            else:
                addBlock(ProseBlock(pendingLabel.rawText), groupStack, blocks)
                pendingLabel = null

        if line.isEmpty():
            finalize(currentGroup, blocks, groupStack)
            currentGroup = null
            continue

        // Group delimiters
        if line.startsWith("{"):
            finalize(currentGroup, blocks, groupStack)
            currentGroup = null
            groupStack = new GroupBlock(name = extractGroupName(line))
            continue

        if line == "}":
            finalize(currentGroup, blocks, groupStack)
            currentGroup = null
            if groupStack != null:
                addToOutput(groupStack, blocks)
                groupStack = null
            continue

        type = classifyByPriority(line)

        if type == PROSE:
            labelInfo = tryParseSelectLabel(line)
            if labelInfo != null:
                finalize(currentGroup, blocks, groupStack)
                currentGroup = null
                pendingLabel = labelInfo
                continue
            finalize(currentGroup, blocks, groupStack)
            currentGroup = null
            addBlock(ProseBlock(line), groupStack, blocks)
            continue

        if type == HINT:
            target = groupStack?.children.last() ?? blocks.last()
            if target != null:
                target.hint += extractHintText(line)
            continue

        id = extractId(line)
        required = extractRequired(line)

        if currentGroup != null and currentGroup.type == type:
            currentGroup.addLine(line)
        else:
            finalize(currentGroup, blocks, groupStack)
            currentGroup = new BlockGroup(type, line, id, required)

    if pendingLabel != null:
        addBlock(ProseBlock(pendingLabel.rawText), groupStack, blocks)

    finalize(currentGroup, blocks, groupStack)

    if groupStack != null:
        addToOutput(groupStack, blocks)

    // Post-processing
    blocks = mergeAdjacentBlocks(blocks)
    blocks = injectFreestyle(blocks)       // skip for required single-select
    blocks = assignAutoIds(blocks)
    blocks = assignTemporalDefaults(blocks)

    return { version: "0.9", blocks: blocks }

function classifyByPriority(line) -> BlockType:
    // Priority order from Token Priority Table
    if line matches "---":                    return DIVIDER
    if line starts with "##":                 return SUBHEADER
    if line starts with "#":                  return HEADER
    if line starts with "//":                 return HINT
    if line matches "![...]()":              return IMAGE_UPLOAD
    if line matches "- [x] " or "- [ ] ":   return MULTI_SELECT_OPTION
    if line matches "[...](...)" and
       parens empty or extensions only:       return FILE_UPLOAD
    if line starts with ">>":                return MULTI_LINE_INPUT
    if line starts with ">":                 return SINGLE_LINE_INPUT
    if line starts with "?!":                return CONFIRMATION
    if line starts with "~":                 return SLIDER
    if line starts with "@datetime":         return DATETIME_PICKER
    if line starts with "@date":             return DATE_PICKER
    if line starts with "@time":             return TIME_PICKER
    if line starts with "@email":            return TYPED_INPUT
    if line starts with "@tel":              return TYPED_INPUT
    if line starts with "@url":              return TYPED_INPUT
    if line starts with "@number":           return TYPED_INPUT
    if line starts with "@password":         return TYPED_INPUT
    if line starts with "@color":            return TYPED_INPUT
    if line starts with "{":                 return GROUP_START
    if line == "}":                          return GROUP_END
    if line matches /^\d+\.\s/:              return SEQUENCE_OPTION
    if line matches /^- /:                   return SINGLE_SELECT_OPTION
    return PROSE
```

---

## Appendix B: Submission Serialization Pseudocode

### Compact

```
function serializeCompact(blocks: List<Block>, values: Map<string, Any>) -> String:
    entries = []

    for block in flattenBlocks(blocks):
        if block is not interactive:
            continue

        id = block.id
        value = values[id]

        formatted = when block.type:
            SINGLE_SELECT  -> value.selected ?? null
            MULTI_SELECT   -> (value.checked + [value.freestyle])
                                .filter(nonEmpty).join(", ") ?? ""
            SEQUENCE       -> value.orderedItems.join(", ")
            CONFIRMATION   -> if value then "Yes" else "No"
            TEXT_INPUT     -> value.text ?? null
            SLIDER         -> value.number.toString()
            DATE           -> value?.format("YYYY-MM-DD") ?? null
            TIME           -> value?.format("HH:MM") ?? null
            DATETIME       -> value?.format("YYYY-MM-DDTHH:MM") ?? null
            FILE_UPLOAD    -> value?.filename ?? null
            IMAGE_UPLOAD   -> value?.filename ?? null

        entries.append("[${id}] ${formatted}")

    return entries.join("\n")
```

### Verbose

```
function serializeVerbose(blocks: List<Block>, values: Map<string, Any>) -> JSON:
    result = {}

    for block in flattenBlocks(blocks):
        if block is not interactive:
            continue

        id = block.id
        value = values[id]

        entry = {
            type: block.type,
            label: block.label,
            value: formatValue(block, value),
        }

        if block.hint:
            entry.hint = block.hint

        when block.type:
            SINGLE_SELECT ->
                entry.options = block.options.map(o -> o.text)
            MULTI_SELECT ->
                entry.options = block.options.map(o -> {
                    text: o.text,
                    selected: value.checked.contains(o.text)
                })
            SEQUENCE ->
                entry.items = block.items  // initial order
            SLIDER ->
                entry.range = [block.min, block.max]
                if block.step: entry.step = block.step
            TEXT_INPUT ->
                entry.multiline = block.multiline
            FILE_UPLOAD ->
                if block.extensions: entry.extensions = block.extensions
            CONFIRMATION ->
                if block.yesLabel != "Yes": entry.yesLabel = block.yesLabel
                if block.noLabel != "No": entry.noLabel = block.noLabel

        result[id] = entry

    return result
```

---

## Appendix C: Auto-ID Derivation Pseudocode

```
function deriveId(label: string) -> string:
    id = label.toLowerCase()
    id = id.replaceAll(/[^\x00-\x7F]/g, "")       // strip non-ASCII
    id = id.replaceAll(/[^a-z0-9]/g, "_")          // special chars → _
    id = id.replaceAll(/_{2,}/g, "_")               // collapse __
    id = id.replaceAll(/^_|_$/g, "")                // strip leading/trailing _

    if id.isEmpty() or id.match(/^[0-9]/):
        id = "field_" + id

    return id

function assignAutoIds(blocks: List<Block>) -> List<Block>:
    usedIds = Set()

    for block in flattenBlocks(blocks):
        if block is not interactive:
            continue

        if block.id == null:
            block.id = deriveId(block.label)

        baseId = block.id
        counter = 2
        while usedIds.contains(block.id):
            block.id = baseId + "_" + counter
            counter++

        usedIds.add(block.id)

    return blocks
```

---

## Appendix D: Confirmation Ternary Parsing Pseudocode

```
function parseConfirmation(line: string) -> ConfirmationBlock:
    content = line.removePrefix("?!").trim()

    // Extract optional ID
    id = null
    if content matches /^([a-z][a-z0-9_]*!?):\s+/:
        id = match[1].removeSuffix("!")
        content = content after match

    // Look for ternary:  question ? yes_label : no_label
    colonIdx = content.lastIndexOf(" : ")
    if colonIdx >= 0:
        qmarkIdx = content.lastIndexOf(" ? ", colonIdx)
        if qmarkIdx >= 0:
            question = content[0 ..< qmarkIdx]
            yesLabel = content[qmarkIdx + 3 ..< colonIdx]
            noLabel  = content[colonIdx + 3 ..]
            return ConfirmationBlock(id, question, yesLabel, noLabel)

    return ConfirmationBlock(id, content, "Yes", "No")
```

---

## Appendix E: Changelog from v0.8

| Change | Detail |
|--------|--------|
| **Single-select syntax changed** | `- Option` (dash prefix) replaces `1. Option` (numbered). Unordered — pick one. |
| **Multi-select syntax changed** | `- [x]` / `- [ ]` (GFM task list) replaces `[v]` / `[ ]`. Standard markdown syntax. |
| **Sequence block added** | `1. Item` / `2. Item` — new block type for drag-to-reorder lists. Numbers define initial order. |
| Added identifier system | Explicit `id:` syntax and auto-derived IDs. All IDs are `[a-z][a-z0-9_]*`. |
| Added required field modifier (`!`) | Context-dependent: text/date/file = non-empty required; single-select = no freestyle; multi-select = at least one selection. |
| Added layout groups | `{ name` / `}` syntax for grouping related fields. Renderer may lay out side-by-side on wider screens. |
| Added searchable option lists | Renderer adapts: 8–15 options → scrollable list with search filter, >15 → searchable dropdown. No new markup syntax. |
| Added AST schema (Part 4) | Formalized JSON schema for parsed output. Doubles as SDUI payload. |
| Added submission formats (Part 5) | Compact (plaintext key-value) and Verbose (typed JSON with metadata). All fields always present; blank fields use `null`. |
| Select label line | Single-select, multi-select, and sequence blocks use a **label line** above the options for display label and ID. |
| Confirmation simplified | Removed `?` vs `?!` distinction. Single prefix `?!`, default is always No. Added ternary syntax for custom button labels: `? yes : no`. |
| File upload syntax | Replaced `^` / `^file` prefix with markdown link syntax: `[label]()` or `[label](.ext)`. |
| Image upload syntax | Replaced `^image` prefix with markdown image syntax: `![label]()`. |
| Date/time/datetime defaults to now | If no explicit default is provided, pickers initialize to the current date/time. |
| Added token priority table | Defines parsing precedence order for resolving prefix ambiguities. |
| Added Design Principle 8 | Multi-turn branching — conditional logic belongs in conversation turns, not form markup. |
| Footnotes | Prose footnotes (`[^N]`) passed through to markdown renderer for disclaimers. |
| Numeric values are recommendations | All dp measurements, thresholds, breakpoints, and durations in Part 3 are advisory, not mandated. |
| Updated system prompts | Both tiers updated to reflect all new syntax. |
| **Typed input blocks added** | `@email`, `@tel`, `@url`, `@number`, `@password`, `@color` prefixes for type-specific text inputs. Same `|` placeholder, `||` prefill, `!` required, and `id:` syntax as text input. |
| **Format annotations added** | `@currency(CODE)`, `@unit(text)`, `@percent`, `@integer`, `@decimal(N)` — display-only formatting for `@number` and `~` slider. Submitted value is always raw. |
| Slider decimal support | Slider min, max, default, and step now support decimal values. |
| Slider format annotations | Sliders can append format annotations: `~ budget: Budget [1000 - 10000] (5000) %1000 @currency(KRW)`. |
| AST: `TypedInputBlock` added | New block node type for typed inputs. Added `FormatAnnotation` type and `displayFormat` field on `SliderBlock` and `TypedInputBlock`. |
| Token priority table updated | Typed input prefixes added at priorities 15-20, after temporal pickers. |
| System prompts updated | Both Tier 1 and Tier 2 updated with typed input and format annotation syntax. |
| Added icon support | Leading emoji/symbol and `:name:` syntax for icons. Renderer-owned resolution chain: symbol → asset → icon library → fallback. |
