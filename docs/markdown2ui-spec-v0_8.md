# markdown2ui Specification v0.8

## Philosophy

When an AI agent encounters a task that requires user input (clarification, choices, confirmation), it should **not** generate a rich UI programmatically — doing so taxes the LLM's reasoning capacity and adds latency. Instead, the agent writes a lightweight plaintext markup called `markdown2ui`, which the client parses into native UI components.

This keeps the LLM focused on **thinking**, not **rendering**.

---

## Design Principles

1. **Zero cognitive overhead for the LLM** — the markup is barely more complex than writing a bulleted list.
2. **Native rendering** — the client (Android, iOS, Web, TV) parses the markup and renders platform-native components. The LLM never sees XML, JSON, or layout code.
3. **Freestyle fallback** — every selection component allows the user to type a freeform answer instead of selecting from options, because discrete options can never cover every case.
4. **Composable** — multiple blocks can appear in a single response, forming a mini-form.
5. **Streamable** — the markup is line-oriented so the client can begin rendering as tokens stream in.
6. **Pre-fill first** — the LLM should pre-select the most likely answer for every input. The user's job is to confirm or adjust, not to answer from scratch.
7. **Semantic, not visual** — the markup defines *what* input is needed, never *how* it looks. The renderer owns all layout decisions.

---

# Part 1: Markup Schema

## Block Types

### 1. Single-Select (Radio)

Numbered options with `.` separator. Exactly one may be selected. The **first option is pre-selected by default** and treated as the recommended choice.

```
1. Option A
2. Option B
3. Option C
```

**Semantics:** Radio group. Option A is pre-selected.

To change the default/recommended option, mark it with `(default)`:

```
1. Option A
2. Option B (default)
3. Option C
```

#### Freestyle

A compact text input is always rendered below the last option with placeholder text: _"Or type your answer..."_

When the user types in the freestyle field, it **replaces** the selected radio option.

---

### 2. Multi-Select (Checkbox)

Square-bracket options. Zero or more may be selected. `[v]` marks a pre-selected (recommended) option. `[ ]` marks an unselected option.

```
[v] Option A
[ ] Option B
[v] Option C
[ ] Option D
```

**Semantics:** Checkbox group. Options A and C are pre-checked.

#### Freestyle

A compact text input is always rendered below the last option with placeholder text: _"Or add your own..."_

When the user types in the freestyle field, it is **appended** as an additional selection alongside checked items.

---

### 3. Confirmation (Yes / No)

A shorthand for a binary decision.

```
? Are you sure you want to delete this file?
```

**Semantics:** A prompt with two buttons: **[Yes]** (primary/default) and **[No]** (secondary).

To flip the default (recommended for destructive/irreversible actions):

```
?! Are you sure you want to delete this file?
```

**Semantics:** **[No]** is now the primary/default, **[Yes]** is secondary.

---

### 4. Text Input

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

---

### 5. Section Header / Label

Provides context or groups questions together. Does not produce an interactive element.

```
# Choose your preferences
```

Subsections:

```
## Build Settings
```

---

### 6. Slider / Range

For numeric input within a bounded range.

```
~ How many items? [1 - 100] (10)
```

- `[min - max]` defines the range.
- `(default)` sets the initial value.

Optional step size after `%`:

```
~ Budget (만원) [5 - 50] (15) %5
```

This creates a slider that snaps to increments of 5 (5, 10, 15, 20...).

---

### 7. Date Picker

```
@date When should we schedule this?
```

**Semantics:** A native date picker. Returns `YYYY-MM-DD`.

Optional default after `|`:

```
@date Check-in date | 2026-03-26
```

---

### 8. Time Picker

```
@time What time works for you?
```

**Semantics:** A native time picker. Returns `HH:MM` (24-hour).

Optional default after `|`:

```
@time Meeting time | 14:00
```

---

### 9. Datetime Picker

```
@datetime When exactly?
```

**Semantics:** A combined date and time picker. Returns `YYYY-MM-DDTHH:MM`.

Optional default after `|`:

```
@datetime Appointment | 2026-03-26T14:00
```

---

### 10. File / Image Upload

```
^ Upload your logo
^image Upload a photo of the issue
^file Upload the CSV file
```

- `^` or `^file` — any file type.
- `^image` — image only (triggers camera + gallery on mobile).

Optional accepted extensions after `|`:

```
^file Upload the data file | .csv, .xlsx
```

---

### 11. Inline Hint / Description

Add a description line directly below any block element using `//`.

```
1. Express (2-3 business days)
2. Standard (5-7 business days)
3. Economy (10-14 business days)
// Shipping speed affects total cost.
```

**Semantics:** Subtle helper text displayed below the parent block.

Multiple consecutive `//` lines are concatenated:

```
// Line one of the hint.
// Line two of the hint.
```

---

### 12. Divider

Separates logical groups visually.

```
---
```

---

## Prefix Detection Table

The parser identifies block type by the **first non-whitespace characters** of each line:

| Prefix Pattern                | Block Type        |
|-------------------------------|-------------------|
| `#` (single)                  | Section header    |
| `##`                          | Subsection header |
| `1.` `2.` `3.` ...           | Single-select     |
| `[ ]` or `[v]`               | Multi-select      |
| `?` (not `?!`)               | Confirmation (Yes default) |
| `?!`                          | Confirmation (No default)  |
| `>` (single, not `>>`)       | Single-line input |
| `>>`                          | Multi-line input  |
| `~`                           | Slider / range    |
| `@date`                       | Date picker       |
| `@time`                       | Time picker       |
| `@datetime`                   | Datetime picker   |
| `^` or `^file`               | File upload       |
| `^image`                      | Image upload      |
| `//`                          | Hint (attaches to previous block) |
| `---`                         | Divider           |
| _(anything else)_             | Prose text        |

---

## Grouping Rules

1. Consecutive lines of the **same block type** are grouped into a single component (e.g., multiple `[ ]` lines → one checkbox group).
2. A **blank line** or a **different block type** ends the current group.
3. Two consecutive groups of the same type (e.g., two single-select groups) **must** be separated by a different block type (header, hint, divider, or prose). Otherwise the parser merges them.
4. `//` hint lines attach to the **immediately preceding** block. They do not start a new group.

---

## Escaped Characters

If a line begins with a markdown2ui prefix but is intended as prose, escape the prefix with `\`:

```
\# This is not a header
\> This is not an input field
```

Characters that require escaping at line start: `#`, `>`, `?`, `~`, `@`, `^`, `[`, `1.`–`99.`

---

## Submission Format

When the user taps **Submit**, the client sends a structured plaintext response:

```
[Project Name] MyAwesomeApp
[Platform] Android, iOS
[Language] Kotlin
[Minimum Android SDK] 24
[Initialize Git] Yes
```

Rules:

- Keys are derived from the label/question text (the text after the prefix sigil).
- Multi-select values are comma-separated.
- Freestyle answers appear as the value directly.
- Slider values are numeric.
- Date values use `YYYY-MM-DD`.
- Time values use `HH:MM`.
- Datetime values use `YYYY-MM-DDTHH:MM`.
- File upload values contain the file name(s).
- Confirmation values are `Yes` or `No`.
- Empty multi-select submits as empty string.
- On single-select, if the user deselects all options and submits without freestyle text, the pre-selected default is submitted.

---

## Composite Example

```
# 호텔 찾아줄게

@date 체크인 날짜 | 2026-03-26
@date 체크아웃 날짜

~ 1박 예산 [50000 - 500000] (150000) %10000
// 단위: 원

## 선호 지역

1. 삿포로역 근처
2. 스스키노 (default)
3. 오도리공원 근처

## 필요 조건

[v] 금연
[ ] 조식 포함
[ ] 대욕장
[ ] 1인실

## 예약 사이트

1. 최저가 아무 데나
2. 아고다
3. 부킹닷컴
4. 트립닷컴
```

Submitted as:

```
[체크인 날짜] 2026-03-26
[체크아웃 날짜] 2026-03-28
[1박 예산] 150000
[선호 지역] 스스키노
[필요 조건] 금연
[예약 사이트] 최저가 아무 데나
```

---

## Streaming Behavior

Since LLM responses stream token-by-token:

1. The parser buffers the current line.
2. On newline (`\n`), it classifies the completed line and begins rendering the appropriate component.
3. If the next line continues the same group (e.g., another `[ ]`), the component expands.
4. If the next line is a different type, the previous component is finalized.
5. Prose lines are rendered as text immediately.

---

## Edge Cases

1. **Empty single-select:** Submit the pre-selected default.
2. **Empty multi-select:** Valid. Submit as empty string.
3. **Freestyle overrides (single-select):** Freestyle text replaces the radio selection.
4. **Freestyle appends (multi-select):** Freestyle text is added alongside checked items.
5. **Nested blocks:** Not supported. All blocks are top-level only.
6. **Maximum options:** No hard limit, but agents should keep single-select ≤ 7 and multi-select ≤ 12 for usability.
7. **Mixed content:** Prose text (lines not matching any prefix) is rendered as rich text between UI blocks.
8. **Prose Markdown:** Prose sections support standard Markdown rendering (bold, italic, code, links). The client routes prose lines through a Markdown renderer.

---

---

# Part 2: System Prompt

Two prompt tiers are provided. The client injects the appropriate tier based on the platform and agent profile.

## Tier 1: Compact Prompt (~350 tokens)

For conversational agents, desktop/web-only, text-heavy workflows.

```
<markdown2ui>
When you need input from the user, use markdown2ui syntax. The client renders
native interactive components from this markup.

Syntax:
- Radio (one):        1. Option A  /  2. Option B  /  3. Option C
  First = default. Override: add (default) to another.
- Checkbox (many):    [v] Pre-selected  /  [ ] Unselected
- Yes/No:             ? Question  (Yes default)  /  ?! Question  (No default)
- Text:               > Single line  /  >> Multi-line
  Placeholder:        > Question | hint text
  Pre-fill:           > Question || value
- Header:             # Section  /  ## Subsection
- Hint:               // Appears below previous block
- Divider:            ---

Rules:
1. Prefer markdown2ui over plain text for user input.
2. Group related questions in one block to minimize round-trips.
3. Pre-select recommended options. Pre-fill text fields when you can infer values.
4. Use (default) only when the first option is NOT the best default.
5. Use ?! for destructive or irreversible actions.
6. Keep labels concise. Use // for extra context.
7. Select blocks auto-include a freestyle input — don't add a > for "Other".
8. Prose before/after markdown2ui blocks is fine — client renders it as text.
</markdown2ui>
```

## Tier 2: Full Prompt (~500 tokens)

For mobile apps, TV/d-pad, form-heavy agents, scheduling/file workflows.

```
<markdown2ui>
When you need input from the user, use markdown2ui syntax. The client renders
native interactive components from this markup.

Syntax:
- Radio (one):        1. Option A  /  2. Option B  /  3. Option C
  First = default. Override: add (default) to another.
- Checkbox (many):    [v] Pre-selected  /  [ ] Unselected
- Yes/No:             ? Question  (Yes default)  /  ?! Question  (No default)
- Text:               > Single line  /  >> Multi-line
  Placeholder:        > Question | hint text
  Pre-fill:           > Question || value
- Header:             # Section  /  ## Subsection
- Slider:             ~ Label [min - max] (default)
  Step size:          ~ Label [min - max] (default) %step
- Date picker:        @date Label  |  default (YYYY-MM-DD)
- Time picker:        @time Label  |  default (HH:MM)
- Datetime picker:    @datetime Label  |  default (YYYY-MM-DDTHH:MM)
- File upload:        ^ Label  /  ^image Label  /  ^file Label | .ext, .ext
- Hint:               // Appears below previous block
- Divider:            ---

Rules:
1. Prefer markdown2ui over plain text for user input.
2. Group related questions in one block to minimize round-trips.
3. Pre-select recommended options. Pre-fill text fields when you can infer values.
4. Use (default) only when the first option is NOT the best default.
5. Use ?! for destructive or irreversible actions.
6. Keep labels concise. Use // for extra context.
7. Select blocks auto-include a freestyle input — don't add a > for "Other".
8. Use @date/@time/@datetime instead of text inputs for temporal values.
9. Use ~ slider for numeric values with a known range.
10. Use ^image when you need a photo from the user (enables camera on mobile).
11. Prose before/after markdown2ui blocks is fine — client renders it as text.
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
│  Line Classifier │  Identifies block type by prefix pattern
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
│  Freestyle       │  Appends text input to single-select
│  Injector        │  and multi-select blocks
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Layout Engine   │  Decides inline vs. stacked, chip vs. list,
│                  │  consolidation, column layout
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

**Input:** Numbered options (e.g., `1. Option A`)

**Component:** Segmented button group, radio list, or chip row — chosen adaptively.

**Layout rules:**

| Condition | Layout |
|-----------|--------|
| 2–3 options, all labels ≤ threshold¹ | **Inline chip row** — single horizontal row, all options in one connected rounded rectangle. Each chip is a tap target. Selected chip is filled; others are outlined. |
| 2–3 options, any label > threshold¹ | **Stacked chip column** — vertical stack, one option per row. All options sit inside one rounded rectangle container with internal dividers. All rows equal width (match widest). |
| 4–7 options | **Stacked radio list** — vertical list with radio indicators on the leading edge. All options inside one container with internal dividers. |
| > 7 options | **Scrollable radio list** — same as stacked, with max-height and internal scroll. |

¹ Threshold is platform-dependent. See §3.3.2.

**Freestyle attachment:** A compact single-line text field is rendered below the last option, inside the same container. Placeholder: _"Or type your answer..."_

**Pre-selection:** The option marked `(default)` or the first option (if no explicit default) renders in the selected state on mount.

**Container:** All options + freestyle input are wrapped in a single rounded rectangle container.

---

### 3.2.2 Multi-Select (Checkbox)

**Input:** Bracket options (e.g., `[v] Option A`)

**Component:** Checkbox list or chip grid — chosen adaptively.

**Layout rules:**

| Condition | Layout |
|-----------|--------|
| 2–4 options, all labels ≤ threshold¹ | **Inline chip row** — horizontal, multi-selectable. Selected chips are filled; unselected are outlined. Wraps to second row if needed. |
| 5–12 options, all labels ≤ threshold¹ | **Chip grid** — wrapping flow layout. Chips auto-wrap based on container width. |
| Any option label > threshold¹ | **Stacked checkbox list** — vertical list with checkboxes on the leading edge. Full container width. Internal dividers. |
| > 12 options | **Scrollable checkbox list** — max-height with internal scroll. |

¹ Threshold is platform-dependent. See §3.3.2.

**Freestyle attachment:** Compact text field below, inside same container. Placeholder: _"Or add your own..."_

**Pre-selection:** Options marked `[v]` render in checked state on mount.

**Container:** Same single rounded rectangle as single-select.

---

### 3.2.3 Confirmation (Yes / No)

**Input:** `?` or `?!` prefix.

**Component:** Inline button pair.

**Layout:**

- Two buttons side-by-side: primary (filled) and secondary (outlined).
- `?` → **[Yes]** is primary (leading), **[No]** is secondary (trailing).
- `?!` → **[No]** is primary (leading), **[Yes]** is secondary (trailing).
- The question text is rendered as a label above the buttons.
- Buttons are equal width, horizontally centered, with `8dp` spacing between them.

**TV/D-pad:** Primary button has initial focus.

---

### 3.2.4 Text Input

**Input:** `>` or `>>`

**Single-line (`>`):**

- `OutlinedTextField` (or platform equivalent) with the question text as a floating label.
- Placeholder text (from `|`) shown inside the field when empty.
- Pre-filled value (from `||`) is set as the initial editable value.

**Multi-line (`>>`):**

- Multi-line text field, minimum 3 visible lines.
- Expands vertically as the user types, up to a renderer-defined max-height.

---

### 3.2.5 Section Header

**Input:** `#` or `##`

**`#` Header:**

- `titleMedium` typography (or platform equivalent).
- Bold weight.
- Top margin: `16dp`. No top margin if it's the first block.
- Bottom margin: `8dp`.

**`##` Subheader:**

- `titleSmall` typography.
- Medium weight.
- Top margin: `12dp`. Bottom margin: `4dp`.

Headers are non-interactive. They act as visual group separators and semantic labels for the blocks that follow.

---

### 3.2.6 Slider / Range

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

### 3.2.7 Date Picker

**Input:** `@date Label`

**Component:** Platform-native date picker.

**Interaction model:**

- A tap target (button-style or outlined field) showing the label and current/default value.
- Tapping opens the platform's native date picker:
  - **Mobile:** Modal bottom sheet or fullscreen dialog.
  - **Desktop:** Popover calendar.
  - **TV:** Fullscreen overlay with scrollable year/month/day spinners.
- If a default is provided (`| YYYY-MM-DD`), it is the initial selection.
- Display format is localized (e.g., `2026년 3월 26일` for ko-KR, `Mar 26, 2026` for en-US).

**Submission format:** Always `YYYY-MM-DD` regardless of display locale.

**This is a distinct component from Time Picker and Datetime Picker.** It shows only a calendar/date selection UI with no time component.

---

### 3.2.8 Time Picker

**Input:** `@time Label`

**Component:** Platform-native time picker.

**Interaction model:**

- Same tap-target pattern as date picker.
- Opens platform time picker:
  - **Android:** Clock face dialog.
  - **iOS:** Scroll wheel.
  - **Web:** `<input type="time">` or custom clock widget.
  - **TV:** Spinner with hour and minute columns.
- Display format is localized (e.g., `오후 2:00` for ko-KR, `2:00 PM` for en-US).
- If a default is provided (`| HH:MM`), it is the initial selection.

**Submission format:** Always `HH:MM` (24-hour) regardless of display locale.

**This is a distinct component from Date Picker.** It shows only a time selection UI with no calendar.

---

### 3.2.9 Datetime Picker

**Input:** `@datetime Label`

**Component:** Combined date and time picker.

**Interaction model:**

- A single tap target showing both date and time values.
- Tapping opens a **two-step sequential picker**: date selection first, then time selection. Or a combined picker if the platform provides one natively.
- If a default is provided (`| YYYY-MM-DDTHH:MM`), both date and time parts are pre-filled.

**Submission format:** Always `YYYY-MM-DDTHH:MM`.

**This is a distinct component from Date Picker and Time Picker.** It collects both date and time in a single block.

---

### 3.2.10 File / Image Upload

**Input:** `^`, `^file`, `^image`

**Component:** Upload button area.

**Layout:**

- A dashed-outline rectangular area with an upload icon and the label text.
- Tapping triggers the OS file/image picker:
  - `^image` → camera + gallery action sheet on mobile.
  - `^file` / `^` → system file picker. If extension filter is provided (`| .csv, .xlsx`), the picker restricts selection.
- After selection, the area shows:
  - **Image:** Thumbnail preview with a remove/replace button.
  - **File:** Filename + file size with a remove/replace button.

**TV/D-pad:** Focus highlights the upload area. Select button opens a file browser overlay.

---

### 3.2.11 Hint

**Input:** `//`

**Component:** Caption text.

**Layout:**

- `bodySmall` or `caption` typography.
- `onSurfaceVariant` color (muted).
- Attached directly below the preceding block's container with `4dp` spacing.
- Multiple consecutive `//` lines are concatenated into one hint.
- Does not have its own container — it belongs to the block above.

---

### 3.2.12 Divider

**Input:** `---`

**Component:** Horizontal rule.

**Layout:**

- Thin line (`1dp` or `hairline`).
- `outlineVariant` color.
- Top and bottom margin: `12dp`.
- Full width of the form container.

---

### 3.2.13 Prose

**Input:** Any line that does not match a markdown2ui prefix.

**Component:** Rich text.

**Layout:**

- Rendered through a standard Markdown renderer (supports bold, italic, code, links, inline code).
- `bodyMedium` typography.
- Normal text color (`onSurface`).
- Consecutive prose lines are merged into a single paragraph.
- A blank line between prose lines creates a paragraph break.

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
@date Check-in | 2026-03-26
@date Check-out
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

**Character width thresholds:**

| Platform | Inline max chars/label (single-select) | Inline max options (single-select) | Inline max chars/label (multi-select) | Inline max options (multi-select) |
|----------|----------------------------------------|------------------------------------|---------------------------------------|-----------------------------------|
| Mobile portrait | 8 | 3 | 6 | 4 |
| Mobile landscape | 12 | 4 | 10 | 6 |
| Tablet / Desktop | 16 | 5 | 12 | 8 |
| TV | 12 | 4 | 10 | 4 |

If **all** labels fit within the character threshold **and** the option count is within the max, the renderer uses an inline chip row. Otherwise, it falls back to a stacked list.

These thresholds are **configurable per platform** and serve as defaults. The renderer should prefer measuring actual rendered text width when possible; character count is a fallback heuristic.

---

### 3.3.3 Screen-Size Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Compact | < 600dp | Single column. All blocks stack vertically. Chips wrap aggressively. |
| Medium | 600–839dp | Single column with wider containers. Inline chips fit more. |
| Expanded | 840–1199dp | Optional two-column layout for independent block groups separated by `---` dividers. |
| Large | ≥ 1200dp | Two-column with generous padding. Date ranges always render side-by-side. |

**Column spanning:** Headers (`#`, `##`), dividers (`---`), confirmation (`?`), and prose always span the full width of the form, regardless of column layout.

---

### 3.3.4 Input Modality Adaptation

| Modality | Adaptations |
|----------|-------------|
| **Touch (mobile)** | Minimum tap target: `48dp × 48dp`. Chips have generous padding. Date/time pickers use bottom sheets. File upload opens system share sheet. |
| **Pointer (desktop)** | Smaller hit targets acceptable. Pickers use popovers. Hover states on chips and buttons. |
| **D-pad / Remote (TV)** | Visible focus ring on all interactive elements. Focus order follows block order top-to-bottom, left-to-right within inline layouts. Slider responds to left/right d-pad. Primary button in confirmation has initial focus. Chip rows navigate with left/right; columns with up/down. |
| **Keyboard (desktop)** | Tab cycles through blocks. Space/Enter toggles selection. Arrow keys navigate within radio/checkbox groups. |

---

### 3.3.5 Container Styling

All interactive blocks (single-select, multi-select, slider, text input, date/time/datetime, file upload) are wrapped in a **card container** with consistent styling:

| Property | Value |
|----------|-------|
| Background | `surfaceContainerLow` (Material 3) or platform equivalent |
| Border | `1dp` solid, `outlineVariant` color |
| Corner radius | `12dp` |
| Internal padding | `16dp` horizontal, `12dp` vertical |
| Spacing between card containers | `12dp` |
| Shadow / Elevation | None (flat) or `1dp` — platform convention |

Headers, hints, dividers, and prose are **not** wrapped in card containers. They sit between cards as structural/decorative elements.

---

### 3.3.6 Form Container

The entire markdown2ui block set in a single agent response is wrapped in a **form container**:

| Property | Value |
|----------|-------|
| Max width | `560dp` (mobile), `640dp` (tablet), `720dp` (desktop/TV) |
| Alignment | Leading-aligned within the chat bubble, or full-width if the form is the only response content |
| Background | Transparent (inherits chat/app background) |
| Bottom action | **[Submit]** button — full width, primary filled style |

**Submit button behavior:**

- Always the last element in the form.
- Enabled by default (since all inputs have defaults or are optional).
- If a validation error exists (e.g., date range violation), the Submit button is disabled.
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
| Primary button (Submit, Yes default) | `primary` / `onPrimary` |
| Secondary button (No default) | `secondaryContainer` / `onSecondaryContainer` |
| Error text / validation | `error` / `onError` |
| Divider | `outlineVariant` |

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

### Streaming Entry

As blocks finalize during streaming, they animate in:

- **Effect:** Fade in (opacity 0 → 1) + slight upward slide (translateY 8dp → 0).
- **Duration:** `150ms`, ease-out.
- **Stagger:** Each block's animation starts `50ms` after the previous block's.

### Selection Feedback

| Interaction | Animation |
|-------------|-----------|
| Chip / radio selection | `150ms` fill color transition |
| Checkbox toggle | `100ms` checkmark scale-in animation |
| Slider thumb movement | Continuous smooth follow (no animation delay) |
| Button press | Platform-standard press feedback (ripple on Android, highlight on iOS) |

### Submit Transition

1. Submit button shows press feedback.
2. The entire form fades out (`200ms`).
3. A compact submission summary card fades in, showing the key-value pairs.

### TV Focus

- Focus ring transitions between elements with `100ms` ease-in-out.
- Focused element scales up `1.02×` for visibility at viewing distance.

---

## 3.6 Accessibility

1. **Semantic roles:** Radio groups expose `role=radiogroup`. Checkbox groups expose `role=group` with `role=checkbox` children. Sliders expose `role=slider` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
2. **Labels:** Every interactive component exposes its label text to the accessibility tree via `contentDescription` (Android), `accessibilityLabel` (iOS), or `aria-label` (Web).
3. **Hints:** `//` hint text is associated with the preceding block via `contentDescription` (Android), `accessibilityHint` (iOS), or `aria-describedby` (Web).
4. **Focus order:** Matches visual block order. Freestyle inputs are part of their parent group's focus cycle.
5. **Screen reader announcements:** Confirmation question text is read as context for the button group. Example: "Are you sure you want to delete this file? Yes, button. No, button."
6. **Contrast:** All text and interactive elements meet WCAG 2.1 AA contrast ratios using the platform's theme tokens.
7. **Motion reduction:** When `prefers-reduced-motion` is enabled (or platform equivalent), skip streaming entry animations and selection transitions.

---

## 3.7 Validation

The renderer performs client-side validation before allowing submission:

| Block Type | Rule | Error Display |
|------------|------|---------------|
| Single-select | Always valid (has default). | — |
| Multi-select | Always valid (empty allowed). | — |
| Confirmation | Always valid (must pick one). | — |
| Text input | Always valid (empty allowed). Future: `!` suffix for required fields. | — |
| Slider | Always valid (has default, bounded range). | — |
| Date | If set, validate `YYYY-MM-DD` format. | Inline error below field. |
| Time | If set, validate `HH:MM` format. | Inline error below field. |
| Datetime | If set, validate `YYYY-MM-DDTHH:MM` format. | Inline error below field. |
| Date range (merged) | End date ≥ start date. | Inline error below range component. Submit disabled. |
| File upload | If extension filter is set, validate file extension. | Inline error: "Unsupported file type. Expected: .csv, .xlsx" |
| File size | Platform-defined max (configurable). | Toast or inline: "File exceeds maximum size." |

---

## 3.8 Platform Component Mapping

### Android (Jetpack Compose)

| Block Type | Component |
|------------|-----------|
| Single-select (inline) | `SingleChoiceSegmentedButtonRow` |
| Single-select (stacked) | Custom `RadioGroup` in `Card` |
| Multi-select (chips) | `FlowRow` { `FilterChip` } |
| Multi-select (stacked) | Custom `CheckboxGroup` in `Card` |
| Confirmation | `Row` { `Button` + `OutlinedButton` } |
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
| Confirmation | `HStack` { `Button(.borderedProminent)` + `Button(.bordered)` } |
| Text input (single) | `TextField` |
| Text input (multi) | `TextEditor` |
| Slider | `Slider(value:in:step:)` |
| Date picker | `DatePicker(displayedComponents: .date)` |
| Time picker | `DatePicker(displayedComponents: .hourAndMinute)` |
| Datetime picker | `DatePicker(displayedComponents: [.date, .hourAndMinute])` |
| File upload | `.fileImporter()` modifier |
| Image upload | `PhotosPicker` |

### Web (HTML / CSS / JS)

| Block Type | Component |
|------------|-----------|
| Single-select (inline) | `<div role="radiogroup">` with styled `<label>` buttons |
| Single-select (stacked) | `<fieldset>` + `<input type="radio">` |
| Multi-select | `<fieldset>` + `<input type="checkbox">` or styled chip `<button>` elements |
| Confirmation | Two `<button>` elements |
| Text input (single) | `<input type="text">` |
| Text input (multi) | `<textarea>` |
| Slider | `<input type="range">` with custom CSS + value readout |
| Date picker | `<input type="date">` |
| Time picker | `<input type="time">` |
| Datetime picker | `<input type="datetime-local">` |
| File upload | `<input type="file" accept=".csv,.xlsx">` |
| Image upload | `<input type="file" accept="image/*" capture="environment">` |

### TV (Android TV / Leanback)

Uses the same Compose components as Android with the following overrides:

| Adaptation | Implementation |
|------------|----------------|
| Focus management | `FocusRequester` chain following visual block order |
| Chip navigation | D-pad left/right within row; up/down exits to adjacent block |
| Slider control | D-pad left/right adjusts by step; long-press hold accelerates |
| Date/time pickers | Fullscreen overlay with scrollable spinner wheels (year, month, day / hour, minute) |
| Minimum tap target | `48dp` minimum, `56dp` recommended for TV viewing distance |
| Submit button | Receives focus after last interactive block via `focusOrder` |

---

## 3.9 Error States

| Error | Behavior |
|-------|----------|
| Date range violation (end < start) | Inline error text below range component in `error` color. Submit button disabled until resolved. |
| File type mismatch | Inline error below upload area: "Unsupported file type. Expected: .csv, .xlsx" |
| File too large | Toast notification or inline error. Max size is client-configurable. |
| Network error on upload | Retry button replaces the upload thumbnail. |
| Parser failure (unrecognized line) | Fall back to rendering the line as prose text. **Never crash. Never show raw markup to the user.** |
| Malformed block syntax | Render as prose. Log a parser warning for debugging. |

---

## Appendix A: Parser Pseudocode

```
function parse(stream: TokenStream) -> List<Block>:
    blocks = []
    currentGroup = null
    lineBuffer = ""

    for token in stream:
        lineBuffer += token

        if not lineBuffer.endsWith("\n"):
            continue

        line = lineBuffer.trim()
        lineBuffer = ""

        if line.isEmpty():
            finalize(currentGroup, blocks)
            currentGroup = null
            continue

        type = classify(line)

        if type == PROSE:
            finalize(currentGroup, blocks)
            currentGroup = null
            blocks.append(ProseBlock(line))
            continue

        if type == HINT:
            if blocks.isNotEmpty():
                blocks.last().hint += extractHintText(line)
            continue

        if currentGroup != null and currentGroup.type == type:
            currentGroup.addLine(line)
        else:
            finalize(currentGroup, blocks)
            currentGroup = new BlockGroup(type, line)

    finalize(currentGroup, blocks)

    // Post-processing
    blocks = mergeAdjacentBlocks(blocks)   // date/time range detection
    blocks = injectFreestyle(blocks)        // text inputs on select blocks

    return blocks
```

---

## Appendix B: Submission Serialization Pseudocode

```
function serialize(blocks: List<Block>, values: Map<Block, Any>) -> String:
    entries = []

    for block in blocks:
        if block is not interactive:
            continue

        label = block.label
        value = values[block]

        formatted = when block.type:
            SINGLE_SELECT  -> value.selected ?: value.freestyle
            MULTI_SELECT   -> (value.checked + [value.freestyle])
                                .filter(nonEmpty).join(", ")
            CONFIRMATION   -> if value then "Yes" else "No"
            TEXT_INPUT     -> value.text
            SLIDER         -> value.number.toString()
            DATE           -> value.format("YYYY-MM-DD")
            TIME           -> value.format("HH:MM")
            DATETIME       -> value.format("YYYY-MM-DDTHH:MM")
            FILE_UPLOAD    -> value.filename

        entries.append("[${label}] ${formatted}")

    return entries.join("\n")
```

---

## Appendix C: Changelog from v0.7

| Change | Detail |
|--------|--------|
| Added pre-fill syntax for text inputs | `\|\|` for pre-filled editable values |
| Added slider step size | `%step` syntax |
| Split Date/Time/Datetime into separate components | `@date`, `@time`, `@datetime` are now documented as distinct components with different native pickers |
| Added file extension filter | `^file Label \| .csv, .xlsx` |
| Added multi-line hint support | Consecutive `//` lines concatenate |
| Added Block Merger stage | Automatic date/time range consolidation |
| Added two-tier system prompt | Compact (~350 tokens) and Full (~500 tokens) |
| Added Renderer Specification | Part 3: adaptive layout, theming, accessibility, platform mappings |
| Added content-adaptive sizing thresholds | Per-platform character/option count thresholds |
| Added screen-size breakpoints | Compact / Medium / Expanded / Large |
| Added input modality adaptation | Touch / Pointer / D-pad / Keyboard rules |
| Added TV platform support | Focus management, spinner pickers, d-pad navigation |
| Principle 6: Pre-fill first | Encourages LLMs to always pre-fill when context is available |
| Principle 7: Semantic not visual | Makes explicit that LLM never controls layout |
