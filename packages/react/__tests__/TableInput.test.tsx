import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

const TABLE = `[table: Products]
- Name: [text]
- Amount: [number]`;

const TABLE_NO_LABEL = `[table]
- Item: [text]
- Qty: [number]`;

describe('TableInput', () => {
  it('renders column headers', () => {
    renderMarkdown(TABLE);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
  });

  it('renders table label', () => {
    renderMarkdown(TABLE);
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('renders one empty row initially with cells per column', () => {
    renderMarkdown(TABLE);
    expect(screen.getAllByRole('gridcell')).toHaveLength(2); // 1 cell per column
  });

  it('shows add row button', () => {
    renderMarkdown(TABLE);
    expect(screen.getByRole('button', { name: '+ Add row' })).toBeInTheDocument();
  });

  it('adds a row when add-row button is clicked', () => {
    renderMarkdown(TABLE);
    fireEvent.click(screen.getByRole('button', { name: '+ Add row' }));
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 data rows
  });

  it('allows editing a cell', () => {
    renderMarkdown(TABLE);
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.change(nameInput, { target: { value: 'Widget' } });
    expect(nameInput).toHaveValue('Widget');
  });

  it('removes a row when remove button is clicked after adding', () => {
    renderMarkdown(TABLE);
    fireEvent.click(screen.getByRole('button', { name: '+ Add row' }));
    expect(screen.getAllByRole('row')).toHaveLength(3);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove row' })[0]);
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('renders table without label', () => {
    renderMarkdown(TABLE_NO_LABEL);
    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
  });

  it('numeric column uses numeric inputMode', () => {
    renderMarkdown(TABLE);
    const amountInput = screen.getByRole('textbox', { name: 'Amount' });
    expect(amountInput).toHaveAttribute('inputMode', 'numeric');
  });

  it('remove row button is present even for the first row', () => {
    renderMarkdown(TABLE);
    expect(screen.getByRole('button', { name: 'Remove row' })).toBeInTheDocument();
  });

  it('retains values in both cells when editing multi-column row', () => {
    renderMarkdown(TABLE);
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Widget' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount' }), { target: { value: '42' } });
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Widget');
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('42');
  });

  it('keeps correct row count after add then remove', () => {
    renderMarkdown(TABLE);
    fireEvent.click(screen.getByRole('button', { name: '+ Add row' }));
    expect(screen.getAllByRole('row')).toHaveLength(3);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove row' })[1]);
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('includes table rows in compact serialization', () => {
    const onSubmit = vi.fn();
    renderMarkdown(TABLE, { onSubmit });
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Widget' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount' }), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    expect(result as string).toContain('[products[0].name] Widget');
    expect(result as string).toContain('[products[0].amount] 9');
  });

  it('currency column shows formatted value on blur', () => {
    renderMarkdown(`[table: Costs]\n- Item: [text]\n- Price: [number @currency(USD)]`);
    const priceInput = screen.getByRole('textbox', { name: 'Price' });
    fireEvent.change(priceInput, { target: { value: '1000' } });
    fireEvent.blur(priceInput);
    expect(priceInput).toHaveValue('$1,000');
  });

  it('shows raw value on focus after blur-formatted currency', () => {
    renderMarkdown(`[table: Costs]\n- Item: [text]\n- Price: [number @currency(USD)]`);
    const priceInput = screen.getByRole('textbox', { name: 'Price' });
    fireEvent.change(priceInput, { target: { value: '1000' } });
    fireEvent.blur(priceInput);
    fireEvent.focus(priceInput);
    expect(priceInput).toHaveValue('1000');
  });
});
