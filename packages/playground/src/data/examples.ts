export interface SpecExample {
  id: string;
  title: string;
  description: string;
  markup: string;
}

export const specExamples: SpecExample[] = [
  {
    id: 'single-select',
    title: 'Single-Select (Radio)',
    description: 'Dash-prefixed options. Pick one. First option is default unless `(default)` is specified.',
    markup: `Preferred language
- Kotlin
- Java (default)
- Swift`,
  },
  {
    id: 'multi-select',
    title: 'Multi-Select (Checkbox)',
    description: 'Task-list syntax. `- [x]` for pre-selected, `- [ ]` for unselected. Includes freestyle input.',
    markup: `conditions: Requirements
- [x] Non-smoking
- [ ] Breakfast included
- [ ] Large bath
- [ ] Single room`,
  },
  {
    id: 'sequence',
    title: 'Sequence (Reorderable)',
    description: 'Numbered items the user can drag to reorder. Numbers define initial order.',
    markup: `priority: Arrange by priority
1. Speed
2. Cost
3. Reliability
4. Usability`,
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    description: 'Binary yes/no prompt. Default is always No. Ternary syntax for custom labels.',
    markup: `?! Are you sure you want to delete this file? ? Yes, delete it. : No, keep it.`,
  },
  {
    id: 'text-input',
    title: 'Text Input',
    description: '`>` for single-line, `>>` for multi-line. `|` for placeholder, `||` for prefill. `>!` for required.',
    markup: `> project_name: Project name | e.g., MyApp || MyAwesomeApp

>>! issue: Describe the issue | Steps to reproduce...`,
  },
  {
    id: 'typed-input',
    title: 'Typed Inputs',
    description: 'Typed inputs: `@email`, `@tel`, `@url`, `@number`, `@password`, `@color`. Same `|` placeholder, `||` prefill, `!` required syntax.',
    markup: `@email user_email: Email address | user@example.com
@tel Phone number | +1 (555) 000-0000
@url website: Website | https://
@password! pw: Password
@number quantity: Quantity | 0
@color Theme color`,
  },
  {
    id: 'slider',
    title: 'Slider / Range',
    description: 'Numeric input with bounded range. Optional step size with `%`.',
    markup: `~ budget: Budget [50000 - 500000] (150000) %10000
// Unit: KRW`,
  },
  {
    id: 'format-annotation',
    title: 'Format Annotations',
    description: 'Format annotations for display: `@currency(CODE)`, `@unit(text|plural)`, `@percent`. Display-only \u2014 submitted value is always raw.',
    markup: `~ budget: Budget [1000 - 10000] (5000) %1000 @currency(KRW)
// Locale-aware: displays as 1,000\uC6D0 ~ 10,000\uC6D0

~ rating: Rating [1 - 5] (3) @unit(star|stars)

~ progress: Progress [0 - 100] (50) @percent

@number amount: Amount @currency(USD)`,
  },
  {
    id: 'temporal',
    title: 'Date / Time / Datetime',
    description: 'Native pickers. Default to current date/time if not specified.',
    markup: `{ schedule
@date checkin: Check-in date | 2026-03-26
@time meeting: Meeting time | 14:00
}

@datetime appointment: Appointment`,
  },
  {
    id: 'upload',
    title: 'File & Image Upload',
    description: 'Markdown link syntax for file, image syntax for photos. Extensions filter in parens.',
    markup: `[report!: Upload report](.pdf, .docx)

![photo: Upload a photo]()`,
  },
  {
    id: 'structure',
    title: 'Headers, Hints, Dividers',
    description: '`#` / `##` for headers, `//` for hints, `---` for dividers. Groups `{ }` for layout.',
    markup: `# Account Settings

## Notifications

Notification preference
- All
- Important only (default)
- None
// You can change this later in settings.

---

## Profile

{ name_fields
> first_name: First name
> last_name: Last name
}`,
  },
  {
    id: 'required',
    title: 'Required Fields',
    description: '`!` disables freestyle on single-select, requires at least one on multi-select, non-empty on text/upload.',
    markup: `>! Company name

lang!: Language
- TypeScript
- Python
- Rust

Requirements!
- [x] Terms of Service
- [ ] Newsletter`,
  },
  {
    id: 'composite',
    title: 'Full Form Example',
    description: 'A realistic multi-block form combining all features.',
    markup: `# Hotel Search

{ date_range
@date checkin: Check-in | 2026-03-26
@date checkout: Check-out
}

~ budget: Budget per night [50000 - 500000] (150000) %10000
// Unit: KRW

region: Preferred area
- Near Sapporo Station
- Susukino (default)
- Near Odori Park

conditions: Requirements
- [x] Non-smoking
- [ ] Breakfast included
- [ ] Large bath

site!: Booking site
- Any cheapest
- Agoda
- Booking.com
- Trip.com

priority: Sort by priority
1. Price
2. Location
3. Reviews
4. Cleanliness

![receipt: Receipt photo]()`,
  },
];

export const playgroundDefault = `# Try markdown2ui

> name: What's your name? | e.g., John

Favorite color
- 🔴 Red
- 🔵 Blue (default)
- 🟢 Green

Features you want
- [x] Dark mode
- [ ] Notifications
- [ ] Analytics

~ rating: Rate your experience [1 - 10] (7)

?! submit: Ready to submit? ? ✅ Yes, let's go! : ❌ Not yet`;

export const iconExample: SpecExample = {
  id: 'icons',
  title: 'Icons',
  description: 'Leading emoji, `:icon_name:` named icons, or single special characters (★, ◆). The renderer resolves named icons via asset lookup or icon library.',
  markup: `# :settings: Preferences

## Emoji icons

Travel mode
- 🚗 Drive
- 🚆 Train (default)
- ✈️ Fly
- 🚲 Cycle

## Named icons

Notifications
- :email: Email alerts
- :notification: Push notifications
- :chat: SMS alerts

## Single character icons

Rating
- ★ Excellent
- ◆ Good
- ○ Average

> :person: Display name | Your name here

?! :delete: Remove account? ? :check: Yes, remove : :close: No, keep`,
};

export const labelDescriptionExample: SpecExample = {
  id: 'label-description',
  title: 'Option Label : Description',
  description: 'Use a colon in option text to separate a bold label from a normal-weight description. The renderer bolds text before the first `:`.',
  markup: `plan: Choose a plan
- Pro: Best for professionals
- Team: Collaborate with your team
- Enterprise: Custom solutions for large orgs

features: What do you need?
- [x] Storage: 100 GB cloud storage included
- [ ] Analytics: Real-time usage dashboards
- [ ] SSO: Single sign-on for your organization
- [ ] Support: Priority 24/7 support`,
};

export const imageOptionExample: SpecExample = {
  id: 'image-options',
  title: 'Image Options',
  description: 'Use `![alt](url)` at the start of an option to attach a thumbnail image. Works with both single-select and multi-select.',
  markup: `## Pick a destination

destination: Where to?
- ![](https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop) Paris
- ![](https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop) Tokyo (default)
- ![](https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=400&h=300&fit=crop) New York

## Choose activities

activities: What interests you?
- [x] ![](https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop) Hiking
- [ ] ![](https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop) Food tours
- [ ] ![](https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop) Snorkeling
- [ ] ![](https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=400&h=300&fit=crop) Photography`,
};
