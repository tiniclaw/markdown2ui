import { describe, it, expect } from 'vitest';
import { parse } from '@markdown2ui/parser';
import { serializeCompact, serializeVerbose } from '../src/serialize.js';

// Build a values map from parsed markup with given overrides
function makeValues(markup: string, overrides: Record<string, any> = {}): Record<string, any> {
  return overrides;
}

describe('serializeCompact — interactive block types', () => {
  it('serializes single-select value', () => {
    const ast = parse(`lang: Language\n- TypeScript\n- Python`);
    const out = serializeCompact(ast, { lang: 'Python' });
    expect(out).toContain('[lang] Python');
  });

  it('serializes multi-select as comma-joined list', () => {
    const ast = parse(`features: Features\n- [x] Dark mode\n- [x] Analytics\n- [ ] SSO`);
    const out = serializeCompact(ast, { features: ['Dark mode', 'Analytics'] });
    expect(out).toContain('[features] Dark mode, Analytics');
  });

  it('serializes multi-select as empty string when nothing selected', () => {
    const ast = parse(`features: Features\n- [ ] Dark mode`);
    const out = serializeCompact(ast, { features: [] });
    expect(out).toContain('[features] ');
  });

  it('serializes sequence as comma-joined order', () => {
    const ast = parse(`priority: Priority\n1. Speed\n2. Cost\n3. Quality`);
    const out = serializeCompact(ast, { priority: ['Cost', 'Quality', 'Speed'] });
    expect(out).toContain('[priority] Cost, Quality, Speed');
  });

  it('serializes confirmation=true as "Yes"', () => {
    const ast = parse(`>! name: Name\n?! agree: Agree?`);
    const out = serializeCompact(ast, { name: 'Alice', agree: true });
    expect(out).toContain('[agree] Yes');
  });

  it('serializes confirmation=false as "No"', () => {
    const ast = parse(`> name: Name\n?! agree: Agree?`);
    const out = serializeCompact(ast, { name: 'Alice', agree: false });
    expect(out).toContain('[agree] No');
  });

  it('serializes text-input value', () => {
    const ast = parse(`> msg: Message`);
    const out = serializeCompact(ast, { msg: 'Hello world' });
    expect(out).toContain('[msg] Hello world');
  });

  it('serializes typed-input value', () => {
    const ast = parse(`@email em: Email`);
    const out = serializeCompact(ast, { em: 'alice@example.com' });
    expect(out).toContain('[em] alice@example.com');
  });

  it('serializes slider value as string', () => {
    const ast = parse(`~ budget: Budget [0 - 1000] (500)`);
    const out = serializeCompact(ast, { budget: 750 });
    expect(out).toContain('[budget] 750');
  });

  it('serializes date value as-is (YYYY-MM-DD)', () => {
    const ast = parse(`@date appt: Appointment`);
    const out = serializeCompact(ast, { appt: '2027-06-15' });
    expect(out).toContain('[appt] 2027-06-15');
  });

  it('serializes time value as-is', () => {
    const ast = parse(`@time t: Time`);
    const out = serializeCompact(ast, { t: '09:30' });
    expect(out).toContain('[t] 09:30');
  });

  it('serializes datetime value as-is', () => {
    const ast = parse(`@datetime dt: When`);
    const out = serializeCompact(ast, { dt: '2027-06-15T09:30' });
    expect(out).toContain('[dt] 2027-06-15T09:30');
  });

  it('serializes file-upload value (filename)', () => {
    const ast = parse(`[Upload report]()`);
    const out = serializeCompact(ast, { upload_report: 'report.pdf' });
    expect(out).toContain('[upload_report] report.pdf');
  });

  it('uses "null" for missing text-input value', () => {
    const ast = parse(`> msg: Message`);
    const out = serializeCompact(ast, {});
    expect(out).toContain('[msg] null');
  });

  it('excludes computed blocks from compact output', () => {
    const ast = parse(`~ a: A [0 - 100] (10)\n~ b: B [0 - 100] (20)\n[computed Total @sum:a,b]`);
    const out = serializeCompact(ast, { a: 10, b: 20 });
    expect(out).not.toContain('Total');
    expect(out).not.toContain('[total]');
  });

  it('excludes display-only blocks (header, prose, divider, hint)', () => {
    const ast = parse(`## My Form\n\nSome prose.\n\n---\n\n> name: Name`);
    const out = serializeCompact(ast, { name: 'Bob' });
    expect(out).toBe('[name] Bob');
  });

  it('excludes condition-hidden blocks', () => {
    const ast = parse(`> state: State\n> ca_q: CA question @if:state==CA`);
    // state is 'NY', so ca_q condition is false
    const out = serializeCompact(ast, { state: 'NY', ca_q: 'some value' });
    expect(out).not.toContain('[ca_q]');
    expect(out).toContain('[state] NY');
  });

  it('includes condition-visible blocks', () => {
    const ast = parse(`> state: State\n> ca_q: CA question @if:state==CA`);
    const out = serializeCompact(ast, { state: 'CA', ca_q: 'Answered' });
    expect(out).toContain('[ca_q] Answered');
  });

  it('serializes table rows as indexed keys', () => {
    const ast = parse(`[table: Items]\n- Name: [text]\n- Price: [number]`);
    const rows = [
      { name: 'Widget', price: '9.99' },
      { name: 'Gadget', price: '19.99' },
    ];
    const out = serializeCompact(ast, { items: rows });
    expect(out).toContain('[items[0].name] Widget');
    expect(out).toContain('[items[0].price] 9.99');
    expect(out).toContain('[items[1].name] Gadget');
  });

  it('serializes repeatable group rows', () => {
    // deriveId('Name') → 'name'; use simple label to keep key predictable
    const ast = parse(`{ passengers @repeatable\n> name: Name\n}`);
    const rows = [{ name: 'Alice' }, { name: 'Bob' }];
    const out = serializeCompact(ast, { passengers: rows });
    expect(out).toContain('[passengers[0].name] Alice');
    expect(out).toContain('[passengers[1].name] Bob');
  });

  it('produces one entry per interactive block in order', () => {
    const ast = parse(`> a: A\n> b: B\n> c: C`);
    const out = serializeCompact(ast, { a: '1', b: '2', c: '3' });
    const lines = out.split('\n');
    expect(lines[0]).toContain('[a]');
    expect(lines[1]).toContain('[b]');
    expect(lines[2]).toContain('[c]');
  });
});

describe('serializeVerbose — block shapes', () => {
  it('wraps text-input in object with type, label, value, multiline', () => {
    const ast = parse(`> msg: Your message`);
    const out = serializeVerbose(ast, { msg: 'Hi' });
    expect(out.msg).toEqual({ type: 'text-input', label: 'Your message', value: 'Hi', multiline: false });
  });

  it('wraps multiline text-input with multiline: true', () => {
    const ast = parse(`>> notes: Notes`);
    const out = serializeVerbose(ast, { notes: 'Line1\nLine2' });
    expect(out.notes.multiline).toBe(true);
  });

  it('wraps typed-input with format field', () => {
    const ast = parse(`@email em: Email`);
    const out = serializeVerbose(ast, { em: 'x@y.com' });
    expect(out.em.format).toBe('email');
    expect(out.em.value).toBe('x@y.com');
  });

  it('wraps single-select with options array', () => {
    const ast = parse(`lang: Language\n- Python\n- Rust`);
    const out = serializeVerbose(ast, { lang: 'Rust' });
    expect(out.lang.options).toEqual(['Python', 'Rust']);
    expect(out.lang.value).toBe('Rust');
  });

  it('wraps multi-select with per-option selected flags', () => {
    const ast = parse(`tags: Tags\n- [ ] Fast\n- [ ] Safe\n- [ ] Fun`);
    const out = serializeVerbose(ast, { tags: ['Fast', 'Fun'] });
    expect(out.tags.options).toEqual([
      { text: 'Fast', selected: true },
      { text: 'Safe', selected: false },
      { text: 'Fun', selected: true },
    ]);
  });

  it('wraps sequence with items array in submitted order', () => {
    const ast = parse(`order: Order\n1. A\n2. B\n3. C`);
    const out = serializeVerbose(ast, { order: ['B', 'A', 'C'] });
    expect(out.order.value).toEqual(['B', 'A', 'C']);
    expect(out.order.items).toEqual(['A', 'B', 'C']);
  });

  it('wraps slider with range and value', () => {
    const ast = parse(`~ rating: Rating [1 - 10] (5)`);
    const out = serializeVerbose(ast, { rating: 8 });
    expect(out.rating.range).toEqual([1, 10]);
    expect(out.rating.value).toBe(8);
  });

  it('includes step in slider when present', () => {
    const ast = parse(`~ s: Steps [0 - 100] (50) %10`);
    const out = serializeVerbose(ast, { s: 50 });
    expect(out.s.step).toBe(10);
  });

  it('does not include step when absent', () => {
    const ast = parse(`~ s: Steps [0 - 100] (50)`);
    const out = serializeVerbose(ast, { s: 50 });
    expect(out.s.step).toBeUndefined();
  });

  it('includes hint when block has one', () => {
    const ast = parse(`> name: Name\n// Enter your full name`);
    const out = serializeVerbose(ast, { name: '' });
    expect(out.name.hint).toBe('Enter your full name');
  });

  it('does not include hint when absent', () => {
    const ast = parse(`> name: Name`);
    const out = serializeVerbose(ast, { name: '' });
    expect(out.name.hint).toBeUndefined();
  });

  it('wraps file-upload with extensions when present', () => {
    const ast = parse(`[Report](.pdf,.docx)`);
    const out = serializeVerbose(ast, { report: null });
    expect(out.report.extensions).toEqual(['.pdf', '.docx']);
  });

  it('wraps confirmation with custom labels only when non-default', () => {
    const ast = parse(`?! agree: Agree? ? Yep : Nope`);
    const out = serializeVerbose(ast, { agree: true });
    expect(out.agree.yesLabel).toBe('Yep');
    expect(out.agree.noLabel).toBe('Nope');
  });

  it('omits yesLabel/noLabel from confirmation when they are the defaults', () => {
    const ast = parse(`?! agree: Agree?`);
    const out = serializeVerbose(ast, { agree: false });
    expect(out.agree.yesLabel).toBeUndefined();
    expect(out.agree.noLabel).toBeUndefined();
  });

  it('wraps table with columns and rows', () => {
    const ast = parse(`[table: Costs]\n- Item: [text]\n- Amount: [number]`);
    const rows = [{ item: 'Widget', amount: '50' }];
    const out = serializeVerbose(ast, { costs: rows });
    expect(out.costs.type).toBe('table');
    expect(out.costs.columns).toHaveLength(2);
    expect(out.costs.rows).toEqual(rows);
  });

  it('includes computed blocks with evaluated value', () => {
    const ast = parse(`~ x: X [0 - 100] (30)\n~ y: Y [0 - 100] (20)\n[computed sum: Total @sum:x,y]`);
    const out = serializeVerbose(ast, { x: 30, y: 20 });
    expect(out.sum.type).toBe('computed');
    expect(out.sum.value).toBe(50);
    expect(out.sum.computed).toBe(true);
  });

  it('wraps repeatable group as { type, repeatable, rows }', () => {
    const ast = parse(`{ items @repeatable\n> item: Item\n}`);
    const rows = [{ item: 'A' }, { item: 'B' }];
    const out = serializeVerbose(ast, { items: rows });
    expect(out.items.type).toBe('group');
    expect(out.items.repeatable).toBe(true);
    expect(out.items.rows).toEqual(rows);
  });

  it('excludes condition-hidden blocks', () => {
    const ast = parse(`> state: State\n> ca_q: CA question @if:state==CA`);
    const out = serializeVerbose(ast, { state: 'NY', ca_q: '' });
    expect(out.ca_q).toBeUndefined();
  });

  it('skips non-interactive blocks (header, prose, divider)', () => {
    const ast = parse(`## Title\n\nSome prose.\n\n> name: Name`);
    const out = serializeVerbose(ast, { name: 'Bob' });
    expect(Object.keys(out)).toEqual(['name']);
  });

  it('null value when field not in values map', () => {
    const ast = parse(`> name: Name`);
    const out = serializeVerbose(ast, {});
    expect(out.name.value).toBeNull();
  });
});
