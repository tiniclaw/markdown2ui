import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

const MULTI = `Interests
- [ ] Coding
- [ ] Design
- [ ] Testing`;

const MULTI_REQUIRED = `interests!: Interests
- [ ] Coding
- [ ] Design`;

describe('MultiSelect', () => {
  it('renders all options as checkboxes', () => {
    renderMarkdown(MULTI);
    expect(screen.getByRole('checkbox', { name: /Coding/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Design/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Testing/ })).toBeInTheDocument();
  });

  it('none checked by default', () => {
    renderMarkdown(MULTI);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => expect(cb).not.toBeChecked());
  });

  it('pre-selected options are checked when using [x] syntax', () => {
    renderMarkdown(`Needs\n- [x] Non-smoking\n- [ ] Breakfast`);
    expect(screen.getByRole('checkbox', { name: /Non-smoking/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Breakfast/ })).not.toBeChecked();
  });

  it('toggles selection on click', () => {
    renderMarkdown(MULTI);
    const cb = screen.getByRole('checkbox', { name: /Coding/ });
    fireEvent.click(cb);
    expect(cb).toBeChecked();
    fireEvent.click(cb);
    expect(cb).not.toBeChecked();
  });

  it('can select multiple options', () => {
    renderMarkdown(MULTI);
    fireEvent.click(screen.getByRole('checkbox', { name: /Coding/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Design/ }));
    expect(screen.getByRole('checkbox', { name: /Coding/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Design/ })).toBeChecked();
  });

  it('shows required asterisk when required', () => {
    renderMarkdown(MULTI_REQUIRED);
    expect(screen.getByText('*', { selector: 'span' })).toBeInTheDocument();
  });

  it('blocks submit when required and nothing selected', () => {
    const onSubmit = vi.fn();
    renderMarkdown(MULTI_REQUIRED, { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows freestyle text input', () => {
    renderMarkdown(MULTI);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onSubmit with selected values', () => {
    const onSubmit = vi.fn();
    renderMarkdown(MULTI_REQUIRED, { onSubmit, format: 'verbose' });
    fireEvent.click(screen.getByRole('checkbox', { name: /Coding/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalled();
    const [result] = onSubmit.mock.calls[0];
    expect((result as any).interests.value).toContain('Coding');
  });

  it('blocks submit when option-required option is not checked', () => {
    const onSubmit = vi.fn();
    // option-required: `- [x]! Terms` — Terms must be checked
    renderMarkdown(`agree: Agreements\n- [x]! Terms of Service\n- [ ] Newsletter`, { onSubmit });
    // Uncheck Terms
    fireEvent.click(screen.getByRole('checkbox', { name: /Terms/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows error when deselecting a required option', () => {
    const onSubmit = vi.fn();
    renderMarkdown(`agree: Agreements\n- [x]! Terms of Service\n- [ ] Newsletter`, { onSubmit });
    fireEvent.click(screen.getByRole('checkbox', { name: /Terms/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText(/Terms of Service/)).toBeInTheDocument();
  });

  it('submits all selected values in order', () => {
    const onSubmit = vi.fn();
    renderMarkdown(MULTI, { onSubmit, format: 'verbose' });
    fireEvent.click(screen.getByRole('checkbox', { name: /Coding/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Testing/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    expect((result as any).interests.value).toEqual(['Coding', 'Testing']);
  });

  it('deselecting all options prevents required submit', () => {
    const onSubmit = vi.fn();
    renderMarkdown(`tags!: Tags\n- [x] Alpha\n- [ ] Beta`, { onSubmit });
    // Alpha is pre-selected; deselect it
    fireEvent.click(screen.getByRole('checkbox', { name: /Alpha/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
