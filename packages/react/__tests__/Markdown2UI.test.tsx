import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Markdown2UI } from '../src/components/Markdown2UI.js';
import { parse } from '@markdown2ui/parser';
import { renderMarkdown } from './helpers.js';

describe('Markdown2UI', () => {
  it('renders from a markdown string', () => {
    renderMarkdown('## Hello\n\nSome prose here.');
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Some prose here.')).toBeInTheDocument();
  });

  it('renders from a pre-parsed AST', () => {
    const ast = parse('## My Form\n\n> Name');
    render(<Markdown2UI source={ast} />);
    expect(screen.getByText('My Form')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows submit button by default', () => {
    renderMarkdown('**Name** [text]');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('uses custom submitLabel', () => {
    renderMarkdown('**Name** [text]', { submitLabel: 'Send It' });
    expect(screen.getByRole('button', { name: 'Send It' })).toBeInTheDocument();
  });

  it('applies className to the container', () => {
    const { container } = renderMarkdown('**Name** [text]', { className: 'my-form' });
    expect(container.firstChild).toHaveClass('m2u-form', 'my-form');
  });

  it('calls onSubmit with compact format by default', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> city: City', { onSubmit });
    const input = screen.getByLabelText('City');
    fireEvent.change(input, { target: { value: 'Paris' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const [result] = onSubmit.mock.calls[0];
    expect(result).toContain('[city]');
    expect(result).toContain('Paris');
  });

  it('calls onSubmit with verbose format when format="verbose"', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> city: City', { onSubmit, format: 'verbose' });
    const input = screen.getByLabelText('City');
    fireEvent.change(input, { target: { value: 'London' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const [result] = onSubmit.mock.calls[0];
    expect(typeof result).toBe('object');
    expect((result as any).city.value).toBe('London');
  });

  it('does not call onSubmit when required field is empty', () => {
    const onSubmit = vi.fn();
    renderMarkdown('>! Name', { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows required error after failed submit', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name!: Name', { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('hides submit button when only one confirmation block', () => {
    renderMarkdown('?! Do you agree?');
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('shows submit button for a regular form without confirmation', () => {
    renderMarkdown('> Name\n\n> Email');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
