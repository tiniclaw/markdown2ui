import { useState, useRef, useEffect, useMemo } from 'react';
import { parse } from '@markdown2ui/parser';
import { RenderWithStyle } from '../renderers';

interface DocSection {
  id: string;
  title: string;
  content: () => React.JSX.Element;
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const contentRef = useRef<HTMLDivElement>(null);

  const sections: DocSection[] = [
    { id: 'getting-started', title: 'Getting Started', content: GettingStarted },
    { id: 'installation', title: 'Installation', content: Installation },
    { id: 'markup-reference', title: 'Markup Reference', content: MarkupReference },
    { id: 'identifiers', title: 'Identifiers & Required', content: Identifiers },
    { id: 'format-annotations', title: 'Format Annotations', content: FormatAnnotations },
    { id: 'groups-layout', title: 'Groups & Layout', content: GroupsLayout },
    { id: 'normalizer', title: 'Normalizer', content: Normalizer },
    { id: 'submission', title: 'Submission Formats', content: SubmissionFormats },
    { id: 'llm-integration', title: 'LLM Integration', content: LLMIntegration },
    { id: 'customization', title: 'Customization', content: Customization },
    { id: 'api-reference', title: 'API Reference', content: APIReference },
    { id: 'roadmap', title: 'Roadmap', content: Roadmap },
  ];

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [activeSection]);

  const ActiveContent = sections.find(s => s.id === activeSection)?.content ?? GettingStarted;

  return (
    <div className="docs">
      <nav className="docs-sidebar">
        <div className="docs-sidebar-title">Documentation</div>
        {sections.map(s => (
          <button
            key={s.id}
            className={`docs-sidebar-link${activeSection === s.id ? ' docs-sidebar-link--active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>
      <div className="docs-content" ref={contentRef}>
        <ActiveContent />
      </div>
    </div>
  );
}

function InlineDemo({ markup }: { markup: string }) {
  const ast = useMemo(() => {
    try { return parse(markup); } catch { return null; }
  }, [markup]);
  if (!ast) return null;
  return (
    <div className="docs-demo">
      <div className="docs-demo-code"><pre>{markup}</pre></div>
      <div className="docs-demo-preview">
        <RenderWithStyle type="plain" ast={ast} onSubmit={() => {}} />
      </div>
    </div>
  );
}

function GettingStarted() {
  return (
    <article className="docs-article">
      <h1>Getting Started</h1>
      <p>
        markdown2ui is a lightweight markup specification that turns plaintext into interactive, native
        UI components. It is designed for AI agents &mdash; the LLM writes natural-feeling markup,
        and the client renders platform-native forms.
      </p>

      <h2>The Problem</h2>
      <p>
        When an LLM needs user input (choices, confirmation, form data), current approaches ask it
        to generate structured UI code: JSON schemas, HTML, SwiftUI, or Compose layouts. This has
        three costs:
      </p>
      <ul>
        <li><strong>Wasted reasoning</strong> &mdash; tokens spent on layout and framework syntax instead of thinking</li>
        <li><strong>Platform lock-in</strong> &mdash; HTML won&rsquo;t run on iOS; SwiftUI won&rsquo;t run on Android</li>
        <li><strong>Security risk</strong> &mdash; executing LLM-generated code in your app is inherently unsafe</li>
      </ul>

      <h2>The Solution</h2>
      <p>
        markdown2ui separates <strong>thinking</strong> from <strong>rendering</strong>. The LLM describes
        <em>what input it needs</em> in simple plaintext. The client parses it into an AST and renders
        native components. No code generation, no eval, no webviews.
      </p>

      <InlineDemo markup={`> name: What's your name? | John Doe

Favorite color
- Red
- Blue (default)
- Green

~ rating: Rating [1 - 5] (4) @unit(star|stars)`} />

      <h2>Design Principles</h2>
      <ol>
        <li><strong>Zero cognitive overhead</strong> &mdash; the markup is barely more complex than a bulleted list</li>
        <li><strong>Native rendering</strong> &mdash; each platform renders with its own UI toolkit</li>
        <li><strong>Freestyle fallback</strong> &mdash; every select allows freeform text input (disable with <code>!</code>)</li>
        <li><strong>Streamable</strong> &mdash; line-oriented syntax enables progressive rendering as tokens arrive</li>
        <li><strong>Pre-fill first</strong> &mdash; the LLM pre-selects the most likely answer; users confirm or adjust</li>
        <li><strong>Semantic, not visual</strong> &mdash; markup defines <em>what</em>, never <em>how</em></li>
        <li><strong>Multi-turn branching</strong> &mdash; conditional logic lives in conversation, not in the form</li>
      </ol>
    </article>
  );
}

function Installation() {
  return (
    <article className="docs-article">
      <h1>Installation</h1>

      <h2>Web (React)</h2>
      <pre className="docs-codeblock">{`npm install @markdown2ui/parser @markdown2ui/react`}</pre>
      <pre className="docs-codeblock">{`import { Markdown2UI } from '@markdown2ui/react';
import '@markdown2ui/react/styles.css';

function ChatUI({ markup }: { markup: string }) {
  return (
    <Markdown2UI
      source={markup}
      onSubmit={(result) => console.log(result)}
    />
  );
}`}</pre>

      <h2>iOS (SwiftUI)</h2>
      <p>Add the Swift Package Manager dependency:</p>
      <pre className="docs-codeblock">{`// Package.swift
dependencies: [
    .package(url: "https://github.com/tiniclaw/markdown2ui.git",
             from: "0.9.0")
]`}</pre>
      <pre className="docs-codeblock">{`import Markdown2UI

// Decode AST from JSON (produced by the TypeScript parser)
let ast = try JSONDecoder().decode(Ast.self, from: jsonData)

Markdown2UIView(ast: ast) { result in
    print(result)
}`}</pre>

      <h2>Android (Jetpack Compose)</h2>
      <p>Add the module dependency:</p>
      <pre className="docs-codeblock">{`// settings.gradle.kts
include(":markdown2ui")
project(":markdown2ui").projectDir = file("path/to/packages/android")

// app/build.gradle.kts
dependencies {
    implementation(project(":markdown2ui"))
}`}</pre>
      <pre className="docs-codeblock">{`import com.markdown2ui.Markdown2UI
import com.markdown2ui.Ast
import kotlinx.serialization.json.Json

val ast = Json.decodeFromString<Ast>(jsonString)

@Composable
fun FormScreen() {
    Markdown2UI(ast = ast) { result ->
        println(result)
    }
}`}</pre>

      <h2>Parser only</h2>
      <p>If you only need the parser (e.g., for a custom renderer or server-side use):</p>
      <pre className="docs-codeblock">{`npm install @markdown2ui/parser

import { parse, normalize } from '@markdown2ui/parser';

const ast = parse(markup);
// or with normalization for SLM tolerance:
const ast = parse(markup, { normalize: true });`}</pre>
    </article>
  );
}

function MarkupReference() {
  return (
    <article className="docs-article">
      <h1>Markup Reference</h1>
      <p>Every block type in the markdown2ui v0.9 specification, with live examples.</p>

      <h2>Single-Select</h2>
      <p>A label line followed by dash-prefixed options. First option is selected by default, or use <code>(default)</code>.</p>
      <InlineDemo markup={`Preferred language
- TypeScript
- Python (default)
- Rust
- Go`} />

      <h2>Multi-Select</h2>
      <p>Task-list syntax. <code>[x]</code> for pre-selected, <code>[ ]</code> for unselected. Includes a freestyle text input.</p>
      <InlineDemo markup={`Features needed
- [x] Authentication
- [x] Dark mode
- [ ] Offline support
- [ ] Analytics`} />

      <h2>Sequence (Reorderable)</h2>
      <p>Numbered items the user can drag to reorder.</p>
      <InlineDemo markup={`priority: Arrange by priority
1. Speed
2. Cost
3. Reliability
4. Usability`} />

      <h2>Text Input</h2>
      <p><code>&gt;</code> for single-line, <code>&gt;&gt;</code> for multi-line. <code>|</code> for placeholder, <code>||</code> for prefill. <code>&gt;!</code> for required.</p>
      <InlineDemo markup={`> project_name: Project name | e.g., MyApp || MyAwesomeApp

>>! issue: Describe the issue | Steps to reproduce...`} />

      <h2>Typed Inputs</h2>
      <p>Type-validated inputs with the same placeholder/prefill/required syntax.</p>
      <InlineDemo markup={`@email user_email: Email | you@example.com
@tel Phone number | +1 (555) 000-0000
@url website: Website | https://
@password! pw: Password
@number quantity: Quantity | 0
@color theme: Theme color`} />

      <h2>Slider / Range</h2>
      <p>Bounded numeric input with optional step size (<code>%</code>).</p>
      <InlineDemo markup={`~ budget: Budget [50000 - 500000] (150000) %10000
// Unit: KRW`} />

      <h2>Date / Time / Datetime</h2>
      <p>Native pickers. Default to current date/time if no value specified.</p>
      <InlineDemo markup={`{ schedule
@date checkin: Check-in date | 2026-03-26
@time meeting: Meeting time | 14:00
}

@datetime appointment: Appointment`} />

      <h2>File &amp; Image Upload</h2>
      <p>Markdown link syntax for files, image syntax for photos. Extensions filter the picker.</p>
      <InlineDemo markup={`[report!: Upload report](.pdf, .docx)

![photo: Upload a photo]()`} />

      <h2>Confirmation</h2>
      <p>Binary yes/no prompt. Default is always No. Ternary syntax for custom labels.</p>
      <InlineDemo markup={`?! Are you sure you want to delete this file? ? Yes, delete it. : No, keep it.`} />

      <h2>Headers, Hints, Dividers</h2>
      <p><code>#</code> / <code>##</code> for headers, <code>//</code> for hints, <code>---</code> for dividers.</p>
      <InlineDemo markup={`# Account Settings

## Notifications

Notification preference
- All
- Important only (default)
- None
// You can change this later in settings.

---

## Profile

> display_name: Display name`} />

      <h2>Image Options</h2>
      <p>Attach thumbnails to select options for card-based layouts using <code>![alt](url)</code> at the start of an option.</p>
      <InlineDemo markup={`destination: Where to?
- ![](https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop) Paris
- ![](https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop) Tokyo (default)
- ![](https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=400&h=300&fit=crop) New York`} />
    </article>
  );
}

function Identifiers() {
  return (
    <article className="docs-article">
      <h1>Identifiers &amp; Required Fields</h1>

      <h2>Explicit IDs</h2>
      <p>
        Assign a stable, machine-readable ID by placing <code>id:</code> before the label.
        IDs must match <code>[a-z][a-z0-9_]*</code>.
      </p>
      <pre className="docs-codeblock">{`> project_name: What is your project name?
~ budget: Budget [100 - 10000] (1000)
@date checkin: Check-in date | 2026-03-26

lang: Preferred language
- Kotlin
- Java

[report: Upload the report](.pdf)
?! delete_confirm: Are you sure?`}</pre>

      <h2>Auto-Derived IDs</h2>
      <p>If no explicit ID is given, the parser derives one from the label text:</p>
      <ol>
        <li>Lowercase the entire label</li>
        <li>Remove all non-ASCII characters</li>
        <li>Replace spaces, hyphens, and special characters with <code>_</code></li>
        <li>Collapse consecutive underscores</li>
        <li>Strip leading and trailing underscores</li>
        <li>If the result is empty or starts with a digit, prefix with <code>field_</code></li>
      </ol>
      <table className="docs-table">
        <thead><tr><th>Label</th><th>Auto-Derived ID</th></tr></thead>
        <tbody>
          <tr><td>What is your project name?</td><td><code>what_is_your_project_name</code></td></tr>
          <tr><td>Region</td><td><code>region</code></td></tr>
          <tr><td>Check-in date</td><td><code>check_in_date</code></td></tr>
        </tbody>
      </table>
      <p>Collision handling: if two blocks produce the same ID, the parser appends <code>_2</code>, <code>_3</code>, etc.</p>

      <h2>Required Fields (<code>!</code>)</h2>
      <table className="docs-table">
        <thead><tr><th>Block Type</th><th><code>!</code> Meaning</th></tr></thead>
        <tbody>
          <tr><td>Text input</td><td>Non-empty required</td></tr>
          <tr><td>Typed input</td><td>Non-empty + type-specific validation</td></tr>
          <tr><td>Single-select</td><td>Freestyle disabled &mdash; must pick from options</td></tr>
          <tr><td>Multi-select (label <code>!</code>)</td><td>At least one option must be selected</td></tr>
          <tr><td>Multi-select (option <code>!</code>)</td><td>That specific option must be checked</td></tr>
          <tr><td>Date / Time / Datetime</td><td>Must have a value</td></tr>
          <tr><td>File / Image upload</td><td>A file must be provided</td></tr>
        </tbody>
      </table>
      <InlineDemo markup={`>! Company name

lang!: Language
- TypeScript
- Python
- Rust

Requirements!
- [x] Terms of Service
- [ ] Newsletter`} />
    </article>
  );
}

function FormatAnnotations() {
  return (
    <article className="docs-article">
      <h1>Format Annotations</h1>
      <p>
        Display-only formatting for numeric values. The annotation controls how the value is
        <em>displayed</em>, but the submitted value is always the raw number.
      </p>
      <table className="docs-table">
        <thead><tr><th>Annotation</th><th>Example Display</th><th>Submitted</th></tr></thead>
        <tbody>
          <tr><td><code>@currency(USD)</code></td><td>$1,234.56</td><td>1234.56</td></tr>
          <tr><td><code>@currency(KRW)</code></td><td>&#8361;1,000</td><td>1000</td></tr>
          <tr><td><code>@unit(kg)</code></td><td>75 kg</td><td>75</td></tr>
          <tr><td><code>@unit(star|stars)</code></td><td>3 stars</td><td>3</td></tr>
          <tr><td><code>@percent</code></td><td>80%</td><td>80</td></tr>
          <tr><td><code>@integer</code></td><td>42</td><td>42</td></tr>
          <tr><td><code>@decimal(2)</code></td><td>3.14</td><td>3.14</td></tr>
        </tbody>
      </table>
      <InlineDemo markup={`~ budget: Budget [1000 - 10000] (5000) %1000 @currency(USD)

~ rating: Rating [1 - 5] (3) @unit(star|stars)

~ progress: Progress [0 - 100] (65) @percent`} />
    </article>
  );
}

function GroupsLayout() {
  return (
    <article className="docs-article">
      <h1>Groups &amp; Layout</h1>
      <p>
        Groups wrap related fields and hint at multi-column layouts on wider screens.
        The renderer decides the actual layout.
      </p>
      <pre className="docs-codeblock">{`{ group_name
> first_name: First name
> last_name: Last name
}`}</pre>
      <p>
        Group names are stripped from the display. They serve as layout hints and
        namespacing for IDs.
      </p>
      <InlineDemo markup={`# Contact Information

{ name_fields
> first_name: First name
> last_name: Last name
}

{ contact
@email email: Email
@tel phone: Phone
}`} />
    </article>
  );
}

function Normalizer() {
  return (
    <article className="docs-article">
      <h1>Normalizer</h1>
      <p>
        The parser includes an optional normalizer that fixes common LLM/SLM mistakes
        before strict parsing. Enable it with <code>{'parse(markup, { normalize: true })'}</code>.
      </p>
      <h2>What it fixes</h2>
      <table className="docs-table">
        <thead><tr><th>Input</th><th>Normalized to</th></tr></thead>
        <tbody>
          <tr><td><code>[X]</code>, <code>[v]</code>, <code>(x)</code>, <code>(&#10003;)</code></td><td><code>[x]</code></td></tr>
          <tr><td><code>* item</code>, <code>+ item</code></td><td><code>- item</code></td></tr>
          <tr><td><code>-text</code> (no space)</td><td><code>- text</code></td></tr>
          <tr><td><code>1)</code> or <code>1:</code></td><td><code>1.</code></td></tr>
          <tr><td><code>@Date</code>, <code>@EMAIL</code></td><td><code>@date</code>, <code>@email</code></td></tr>
          <tr><td><code>?</code> (confirmation)</td><td><code>?!</code></td></tr>
          <tr><td><code>![label]</code> (no parens)</td><td><code>![label]()</code></td></tr>
        </tbody>
      </table>
      <p>
        This makes markdown2ui tolerant of imperfect output, especially from smaller or
        fine-tuned models that may not produce exact syntax.
      </p>
    </article>
  );
}

function SubmissionFormats() {
  return (
    <article className="docs-article">
      <h1>Submission Formats</h1>
      <p>
        When the user submits a form, the renderer serializes the form state into one of two formats.
      </p>

      <h2>Compact (default)</h2>
      <p>Flat key-value pairs. Minimal tokens for the LLM to parse.</p>
      <pre className="docs-codeblock">{`name: John Doe
favorite_color: Blue
rating: 4`}</pre>

      <h2>Verbose</h2>
      <p>Full metadata including types, labels, and selected indices.</p>
      <pre className="docs-codeblock">{`{
  "name": {
    "type": "text-input",
    "label": "What's your name?",
    "value": "John Doe"
  },
  "favorite_color": {
    "type": "single-select",
    "label": "Favorite color",
    "value": "Blue",
    "selectedIndex": 1
  },
  "rating": {
    "type": "slider",
    "label": "Rating",
    "value": 4,
    "min": 1,
    "max": 5
  }
}`}</pre>

      <h2>Choosing a format</h2>
      <ul>
        <li><strong>Compact</strong> is ideal for most LLM integrations &mdash; fewer tokens, faster parsing</li>
        <li><strong>Verbose</strong> is useful for logging, analytics, or when the LLM needs full context about what the user saw</li>
      </ul>
    </article>
  );
}

function LLMIntegration() {
  return (
    <article className="docs-article">
      <h1>LLM Integration</h1>
      <p>
        markdown2ui is designed so that LLMs need <strong>minimal instructions</strong> to generate
        valid markup. The syntax is natural enough that most models produce correct output with
        just a few examples.
      </p>

      <h2>Minimal system prompt</h2>
      <pre className="docs-codeblock">{`When you need user input, write markdown2ui markup:
- Options: "Label\\n- Option 1\\n- Option 2"
- Text input: "> Label | placeholder"
- Required: add ! (e.g., ">! Label", "Label!")
The client will render native UI from your markup.`}</pre>

      <h2>Full system prompt</h2>
      <p>For maximum coverage, include a brief reference of all block types:</p>
      <pre className="docs-codeblock">{`When you need user input, write markdown2ui markup.
The client parses your text and renders native UI.

Block types:
  Select one:     Label\\n- Option 1\\n- Option 2
  Select many:    Label\\n- [x] Checked\\n- [ ] Unchecked
  Text input:     > Label | placeholder || prefill
  Multi-line:     >> Label | placeholder
  Typed:          @email/@tel/@url/@number/@password/@color Label
  Slider:         ~ Label [min - max] (default) %step
  Date/time:      @date/@time/@datetime Label | value
  File upload:    [Label](.ext1, .ext2)
  Image upload:   ![Label]()
  Confirm:        ?! Question ? Yes label : No label
  Reorder:        1. Item\\n2. Item

Modifiers:
  Required:  ! (e.g., >! Label, Label!)
  Explicit ID: id: Label
  Header:    # Title
  Hint:      // helper text
  Divider:   ---
  Group:     { name ... }`}</pre>

      <h2>Multi-turn pattern</h2>
      <p>
        The recommended pattern is multi-turn conversation where the LLM sends markup,
        receives the user&rsquo;s submission, and decides what to ask next. Conditional logic
        belongs in the conversation flow, not in the form.
      </p>
      <pre className="docs-codeblock">{`LLM → markup (initial form)
User → submits selections
LLM → processes answers, sends follow-up markup
User → submits again
...`}</pre>
    </article>
  );
}

function Customization() {
  return (
    <article className="docs-article">
      <h1>Customization</h1>

      <h2>CSS Theming (React)</h2>
      <p>Override CSS custom properties on the form container:</p>
      <pre className="docs-codeblock">{`.m2u-form {
  --m2u-primary: #6366f1;
  --m2u-on-primary: #ffffff;
  --m2u-surface: #fafafa;
  --m2u-on-surface: #1a1a1a;
  --m2u-outline: #d4d4d8;
  --m2u-error: #ef4444;
  --m2u-font: 'Inter', sans-serif;
}`}</pre>

      <h2>Icon resolution</h2>
      <p>
        Icons are resolved by the renderer, not the spec. The default resolution chain:
      </p>
      <ol>
        <li>Leading emoji or symbol character</li>
        <li>Named icon syntax (<code>:icon_name:</code>)</li>
        <li>Icon library lookup (Font Awesome, SF Symbols, Material Icons)</li>
        <li>Graceful fallback to plain text</li>
      </ol>

      <h2>Custom renderers</h2>
      <p>
        The spec deliberately separates parsing from rendering. To build a custom renderer:
      </p>
      <ol>
        <li>Parse markup to AST using <code>@markdown2ui/parser</code> (or your own parser)</li>
        <li>Walk the <code>ast.blocks</code> array</li>
        <li>Render each block type with your UI framework</li>
        <li>Manage form state and serialize on submit</li>
      </ol>
      <p>
        The playground includes four renderer implementations (Plain, shadcn/ui, Material, JSON-render)
        as reference.
      </p>
    </article>
  );
}

function APIReference() {
  return (
    <article className="docs-article">
      <h1>API Reference</h1>

      <h2>@markdown2ui/parser</h2>
      <h3><code>parse(input, options?)</code></h3>
      <pre className="docs-codeblock">{`import { parse } from '@markdown2ui/parser';

const ast = parse(markupString);
// With normalization:
const ast = parse(markupString, { normalize: true });`}</pre>
      <p>Returns an <code>AST</code> object with <code>version</code> and <code>blocks</code> array.</p>

      <h3><code>normalize(input)</code></h3>
      <pre className="docs-codeblock">{`import { normalize } from '@markdown2ui/parser';

const fixed = normalize(sloppyMarkup);`}</pre>
      <p>Fixes common LLM mistakes and returns the corrected markup string.</p>

      <h2>@markdown2ui/react</h2>
      <h3><code>&lt;Markdown2UI&gt;</code></h3>
      <table className="docs-table">
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>source</code></td><td><code>string | AST</code></td><td>required</td><td>Raw markup or pre-parsed AST</td></tr>
          <tr><td><code>normalizeInput</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Run normalizer before parsing</td></tr>
          <tr><td><code>format</code></td><td><code>'compact' | 'verbose'</code></td><td><code>'compact'</code></td><td>Submission output format</td></tr>
          <tr><td><code>onSubmit</code></td><td><code>(result, ast) =&gt; void</code></td><td>&mdash;</td><td>Called on form submission</td></tr>
          <tr><td><code>submitLabel</code></td><td><code>string</code></td><td><code>'Submit'</code></td><td>Submit button text</td></tr>
          <tr><td><code>className</code></td><td><code>string</code></td><td>&mdash;</td><td>Additional CSS class</td></tr>
        </tbody>
      </table>

      <h2>AST Types</h2>
      <pre className="docs-codeblock">{`interface AST {
  version: '0.9';
  blocks: Block[];
}

// Block is a union of 16+ types:
type Block =
  | SingleSelectBlock | MultiSelectBlock
  | SequenceBlock     | ConfirmationBlock
  | TextInputBlock    | TypedInputBlock
  | SliderBlock       | DateBlock
  | TimeBlock         | DatetimeBlock
  | FileUploadBlock   | ImageUploadBlock
  | HeaderBlock       | HintBlock
  | DividerBlock      | ProseBlock
  | GroupBlock;`}</pre>
    </article>
  );
}

function Roadmap() {
  return (
    <article className="docs-article">
      <h1>Roadmap to v1.0</h1>
      <p>
        markdown2ui v0.9 covers the core form building blocks. Here&rsquo;s what we&rsquo;re
        planning for v1.0, while maintaining the simplicity that makes markdown2ui work:
      </p>

      <h2>Planned Features</h2>
      <ul>
        <li><strong>Conditional visibility</strong> &mdash; show/hide blocks based on other selections</li>
        <li><strong>Inline validation rules</strong> &mdash; min/max length, regex patterns in markup</li>
        <li><strong>Multi-page forms</strong> &mdash; wizard flow with step indicators</li>
        <li><strong>Repeatable groups</strong> &mdash; dynamic add/remove rows</li>
        <li><strong>Table input</strong> &mdash; spreadsheet-like grid for tabular data</li>
        <li><strong>Computed fields</strong> &mdash; <code>@sum</code>, <code>@count</code> for derived values</li>
      </ul>

      <h2>Infrastructure</h2>
      <ul>
        <li><strong>npm registry publication</strong> &mdash; proper versioned releases</li>
        <li><strong>Swift Package registry</strong> &mdash; tagged releases for SPM</li>
        <li><strong>Maven Central</strong> &mdash; published Android artifact</li>
        <li><strong>Server-side parsers</strong> &mdash; Python and Go implementations</li>
        <li><strong>Plugin API</strong> &mdash; register custom block types</li>
      </ul>

      <h2>Quality</h2>
      <ul>
        <li><strong>Accessibility audit</strong> &mdash; ARIA labels, keyboard navigation, screen readers</li>
        <li><strong>Performance benchmarks</strong> &mdash; parse time, render time, bundle size</li>
        <li><strong>Localization</strong> &mdash; i18n support for labels and error messages</li>
        <li><strong>Comprehensive test coverage</strong> &mdash; cross-platform conformance suite</li>
      </ul>

      <h2>Guiding Principle</h2>
      <p>
        Every v1.0 feature must pass the simplicity test: <em>can the LLM still write this
        without thinking about it?</em> If a feature requires the LLM to reason about structure,
        nesting, or platform specifics, it doesn&rsquo;t belong in the markup.
      </p>
    </article>
  );
}
