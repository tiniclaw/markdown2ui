import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Markdown2UI } from '../src/components/Markdown2UI.js';
import { renderMarkdown } from './helpers.js';

describe('Conditional visibility', () => {
  const CONDITIONAL = `> state: What state are you in?
> ca_q: CA-specific question @if:state==CA`;

  it('hides a block whose condition is initially false', () => {
    renderMarkdown(CONDITIONAL);
    expect(screen.queryByLabelText('CA-specific question')).not.toBeInTheDocument();
  });

  it('shows a block when its condition becomes true', () => {
    renderMarkdown(CONDITIONAL);
    const stateInput = screen.getByLabelText('What state are you in?');
    fireEvent.change(stateInput, { target: { value: 'CA' } });
    expect(screen.getByLabelText('CA-specific question')).toBeInTheDocument();
  });

  it('hides a block again when condition becomes false', () => {
    renderMarkdown(CONDITIONAL);
    const stateInput = screen.getByLabelText('What state are you in?');
    fireEvent.change(stateInput, { target: { value: 'CA' } });
    expect(screen.getByLabelText('CA-specific question')).toBeInTheDocument();
    fireEvent.change(stateInput, { target: { value: 'NY' } });
    expect(screen.queryByLabelText('CA-specific question')).not.toBeInTheDocument();
  });
});

describe('Repeatable groups', () => {
  const REPEATABLE = `{ Items @repeatable
> item: Item name
}`;

  it('renders one row initially', () => {
    renderMarkdown(REPEATABLE);
    expect(screen.getAllByLabelText('Item name')).toHaveLength(1);
  });

  it('shows add-item button', () => {
    renderMarkdown(REPEATABLE);
    expect(screen.getByRole('button', { name: '+ Add item' })).toBeInTheDocument();
  });

  it('adds a row when add button is clicked', () => {
    renderMarkdown(REPEATABLE);
    fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
    expect(screen.getAllByLabelText('Item name')).toHaveLength(2);
  });

  it('shows remove button after adding a second row', () => {
    renderMarkdown(REPEATABLE);
    fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(2);
  });

  it('removes a row when remove button is clicked', () => {
    renderMarkdown(REPEATABLE);
    fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
    expect(screen.getAllByLabelText('Item name')).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(screen.getAllByLabelText('Item name')).toHaveLength(1);
  });
});

describe('Computed fields', () => {
  const COMPUTED = `~ price1: Price 1 [0 - 1000] (100)
~ price2: Price 2 [0 - 1000] (200)
[computed Total @sum:price1,price2]`;

  it('renders computed field label', () => {
    renderMarkdown(COMPUTED);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows initial sum of default values', () => {
    renderMarkdown(COMPUTED);
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('updates reactively when a slider changes', () => {
    renderMarkdown(COMPUTED);
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '400' } });
    expect(screen.getByText('600')).toBeInTheDocument();
  });

  it('has aria-live="polite" for screen reader support', () => {
    const { container } = renderMarkdown(COMPUTED);
    const computed = container.querySelector('.m2u-computed-value');
    expect(computed).toHaveAttribute('aria-live', 'polite');
  });
});

describe('Plugin API (custom block renderers)', () => {
  it('uses custom renderer for a registered block type', () => {
    function BadgeRenderer({ block }: { block: any }) {
      return <div data-testid="custom-badge">{block.customType}</div>;
    }
    render(
      <Markdown2UI
        source="[custom:badge color=red text=Important]"
        blockRenderers={{ custom: BadgeRenderer }}
      />
    );
    expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    expect(screen.getByTestId('custom-badge')).toHaveTextContent('badge');
  });

  it('silently ignores custom blocks without a registered renderer', () => {
    const { container } = renderMarkdown('[custom:badge color=red]');
    expect(container.querySelector('[data-testid="custom-badge"]')).not.toBeInTheDocument();
  });
});

describe('Conditional visibility — edge cases', () => {
  it('hides a block when != condition is true (values are equal)', () => {
    const src = `> role: Role\n> extra: Extra field @if:role!=admin`;
    renderMarkdown(src);
    // default value of role is '', which != 'admin' is true, so extra IS shown initially
    expect(screen.getByLabelText('Extra field')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'admin' } });
    // now role == admin, so role != admin is false → hidden
    expect(screen.queryByLabelText('Extra field')).not.toBeInTheDocument();
  });

  it('shows a block again when != condition becomes true', () => {
    const src = `> role: Role\n> extra: Extra field @if:role!=admin`;
    renderMarkdown(src);
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'admin' } });
    expect(screen.queryByLabelText('Extra field')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'user' } });
    expect(screen.getByLabelText('Extra field')).toBeInTheDocument();
  });

  it('handles quoted values with spaces in @if condition', () => {
    const src = `> country: Country\n> details: Details @if:country=="United States"`;
    renderMarkdown(src);
    expect(screen.queryByLabelText('Details')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'United States' } });
    expect(screen.getByLabelText('Details')).toBeInTheDocument();
  });

  it('does not block submit when a hidden required field is empty', () => {
    const onSubmit = vi.fn();
    const src = `> flag: Flag\n> hidden!: Required but hidden @if:flag==show`;
    renderMarkdown(src, { onSubmit });
    // flag is '' so hidden field is hidden — submit should succeed
    fireEvent.change(screen.getByLabelText('Flag'), { target: { value: 'other' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('excludes condition-hidden blocks from compact serialization', () => {
    const onSubmit = vi.fn();
    const src = `> state: State\n> ca: CA only @if:state==CA`;
    renderMarkdown(src, { onSubmit });
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'TX' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    expect(result as string).not.toContain('[ca]');
  });
});

describe('Repeatable groups — edge cases', () => {
  const REPEATABLE_MIN = `{ items @repeatable @min(2)
> item: Item
}`;

  it('starts with minRows rows when @min is specified', () => {
    renderMarkdown(REPEATABLE_MIN);
    expect(screen.getAllByLabelText('Item')).toHaveLength(2);
  });

  it('hides remove button when at minRows', () => {
    renderMarkdown(REPEATABLE_MIN);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('enables remove button after adding a row beyond min', () => {
    renderMarkdown(REPEATABLE_MIN);
    fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
    const removeBtns = screen.getAllByRole('button', { name: 'Remove' });
    removeBtns.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it('serializes row values in compact output', () => {
    const onSubmit = vi.fn();
    const src = `{ passengers @repeatable\n> name: Passenger name\n}`;
    renderMarkdown(src, { onSubmit });
    fireEvent.change(screen.getByLabelText('Passenger name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
    const nameInputs = screen.getAllByLabelText('Passenger name');
    fireEvent.change(nameInputs[1], { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    // 'name' is the explicit id prefix from '> name: Passenger name'
    expect(result as string).toContain('[passengers[0].name] Alice');
    expect(result as string).toContain('[passengers[1].name] Bob');
  });
});

describe('Computed fields — edge cases', () => {
  const COUNT_SRC = `{ items @repeatable
> item: Item name
}
[computed item_count: Item count @count:items]`;

  it('counts repeatable group rows', () => {
    renderMarkdown(COUNT_SRC);
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 row initially
  });

  it('updates count when rows are added', () => {
    renderMarkdown(COUNT_SRC);
    fireEvent.click(screen.getByRole('button', { name: '+ Add item' }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows 0 when sum fields are absent from values (not yet initialized)', () => {
    renderMarkdown(`[computed total: Total @sum:x,y]`);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('included in verbose serialization with computed: true', () => {
    const onSubmit = vi.fn();
    const src = `~ a: A [0 - 100] (10)\n~ b: B [0 - 100] (20)\n[computed sum: Sum @sum:a,b]`;
    renderMarkdown(src, { onSubmit, format: 'verbose' });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    expect((result as any).sum.computed).toBe(true);
    expect((result as any).sum.value).toBe(30);
  });
});

describe('Plugin API — edge cases', () => {
  it('passes payload to the custom renderer', () => {
    function BadgeRenderer({ block }: { block: any }) {
      return <div data-testid="badge" data-color={block.payload.color}>{block.payload.text}</div>;
    }
    const { container } = renderMarkdown('[custom:badge color=red text=New]', {
      blockRenderers: { custom: BadgeRenderer },
    });
    const badge = container.querySelector('[data-testid="badge"]');
    expect(badge).toHaveAttribute('data-color', 'red');
    expect(badge).toHaveTextContent('New');
  });

  it('renders custom renderer by block.customType, not block.type', () => {
    function ARenderer({ block }: { block: any }) {
      return <span data-testid={block.customType} />;
    }
    renderMarkdown('[custom:special_widget label=hello]', {
      blockRenderers: { custom: ARenderer },
    });
    expect(screen.getByTestId('special_widget')).toBeInTheDocument();
  });
});

describe('Strings override (i18n)', () => {
  it('uses overridden uploadFile string', () => {
    renderMarkdown('[Upload your logo]()', { strings: { uploadFile: 'Hochladen' } });
    expect(screen.getByText('Hochladen')).toBeInTheDocument();
  });

  it('uses overridden uploadImage string', () => {
    renderMarkdown('![Upload photo]()', { strings: { uploadImage: 'Foto hochladen' } });
    expect(screen.getByText('Foto hochladen')).toBeInTheDocument();
  });

  it('uses overridden addItem string in repeatable group', () => {
    const src = `{ Items @repeatable\n> item: Item\n}`;
    renderMarkdown(src, { strings: { addItem: '+ Hinzufügen' } });
    expect(screen.getByRole('button', { name: '+ Hinzufügen' })).toBeInTheDocument();
  });

  it('uses overridden fieldRequired string in validation', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name!: Name', { onSubmit, strings: { fieldRequired: 'Pflichtfeld' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Pflichtfeld')).toBeInTheDocument();
  });
});
