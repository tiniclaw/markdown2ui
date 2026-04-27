import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

describe('Confirmation', () => {
  it('renders Yes and No buttons', () => {
    renderMarkdown('?! Do you agree?');
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('renders custom labels via ternary syntax', () => {
    renderMarkdown('?! Ready ? Sure! : Nope');
    expect(screen.getByRole('button', { name: 'Sure!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nope' })).toBeInTheDocument();
  });

  it('renders confirmation label text', () => {
    renderMarkdown('?! Do you agree?');
    expect(screen.getByText('Do you agree?')).toBeInTheDocument();
  });

  it('single confirmation hides the submit button', () => {
    renderMarkdown('?! Do you agree?');
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('calls onSubmit when Yes is clicked (solo confirmation)', () => {
    const onSubmit = vi.fn();
    renderMarkdown('?! agree: Do you agree?', { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not call onSubmit when No is clicked', () => {
    const onSubmit = vi.fn();
    renderMarkdown('?! agree: Do you agree?', { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides submit even when other blocks precede confirmation', () => {
    renderMarkdown('> Name\n\n?! Do you agree?');
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('renders strings-overridden Yes/No labels', () => {
    renderMarkdown('?! Do you agree?', {
      strings: { /* uses defaults — Yes/No */ },
    });
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('two confirmations: submit button is visible', () => {
    renderMarkdown('?! First?\n\n?! Second?');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('Yes click sets confirmation value to true in compact output', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name: Name\n\n?! agree: Agree?', { onSubmit });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    const [result] = onSubmit.mock.calls[0];
    expect(result as string).toContain('[agree] Yes');
  });

  it('solo confirmation with required field blocks submit on Yes when field is empty', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name!: Name\n\n?! agree: Agree?', { onSubmit });
    // name is empty — click Yes should NOT fire onSubmit
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('solo confirmation succeeds when all required fields are filled', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name!: Name\n\n?! agree: Agree?', { onSubmit });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('No button does not call onSubmit', () => {
    const onSubmit = vi.fn();
    renderMarkdown('?! agree: Do you agree?', { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
