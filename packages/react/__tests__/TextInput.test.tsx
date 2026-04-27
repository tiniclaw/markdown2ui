import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

describe('TextInput', () => {
  it('renders a text input with label', () => {
    renderMarkdown('> Your Name');
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
  });

  it('renders a single-line input for single > prefix', () => {
    renderMarkdown('> name: Name');
    const input = screen.getByLabelText('Name');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders a textarea for >> (multiline) prefix', () => {
    renderMarkdown('>> Bio');
    const input = screen.getByLabelText('Bio');
    expect(input.tagName).toBe('TEXTAREA');
  });

  it('shows placeholder text when provided', () => {
    renderMarkdown('> Name | Enter your name');
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('shows required asterisk when field is required', () => {
    renderMarkdown('>! Name');
    expect(screen.getByText('*', { selector: 'span' })).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    renderMarkdown('> Name');
    expect(screen.queryByText('*', { selector: 'span' })).not.toBeInTheDocument();
  });

  it('shows prefill value', () => {
    renderMarkdown('> name: Name | hint || John Doe');
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('updates value on change', () => {
    renderMarkdown('> name: Name');
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(input).toHaveValue('Alice');
  });

  it('shows error after failed required submit', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name!: Name', { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows hint when provided', () => {
    renderMarkdown('> Name\n// Enter your full name');
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('blocks submit for whitespace-only required field', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name!: Name', { onSubmit });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('allows submit after correcting a whitespace-only value', () => {
    const onSubmit = vi.fn();
    renderMarkdown('> name!: Name', { onSubmit });
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('multiline textarea accepts and reflects newline characters', () => {
    renderMarkdown('>> notes: Notes');
    const textarea = screen.getByLabelText('Notes');
    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('uses aria-required="true" when field is required', () => {
    renderMarkdown('> name!: Name');
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-required', 'true');
  });

  it('does not set aria-required when field is optional', () => {
    renderMarkdown('> name: Name');
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-required');
  });
});
