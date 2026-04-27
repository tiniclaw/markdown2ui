import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

describe('TypedInput', () => {
  it('renders email input with type="email"', () => {
    renderMarkdown('@email Email address');
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email');
  });

  it('renders tel input with type="tel"', () => {
    renderMarkdown('@tel Phone number');
    expect(screen.getByLabelText('Phone number')).toHaveAttribute('type', 'tel');
  });

  it('renders url input with type="url"', () => {
    renderMarkdown('@url Website');
    expect(screen.getByLabelText('Website')).toHaveAttribute('type', 'url');
  });

  it('renders number input as text with inputMode="numeric"', () => {
    renderMarkdown('@number Amount');
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputMode', 'numeric');
  });

  it('renders password input with type="password"', () => {
    renderMarkdown('@password Secret');
    expect(screen.getByLabelText('Secret')).toHaveAttribute('type', 'password');
  });

  it('shows placeholder text', () => {
    renderMarkdown('@email email: Email | user@example.com');
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    renderMarkdown('@email email!: Email address');
    expect(screen.getByText('*', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows error for invalid email on submit', () => {
    const onSubmit = vi.fn();
    renderMarkdown('@email em: Email', { onSubmit });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows formatted currency value when blurred', () => {
    renderMarkdown('@number amount: Amount @currency(USD)');
    const input = screen.getByLabelText('Amount');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('$1,000');
  });

  it('shows raw value when focused', () => {
    renderMarkdown('@number amount: Amount @currency(USD)');
    const input = screen.getByLabelText('Amount');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.blur(input);
    fireEvent.focus(input);
    expect(input).toHaveValue('1000');
  });

  it('shows hint when provided', () => {
    renderMarkdown('@email Email\n// We\'ll never share your email');
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it('does not show error when valid email is submitted', () => {
    const onSubmit = vi.fn();
    renderMarkdown('@email em: Email', { onSubmit });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument();
  });

  it('shows error for invalid URL on submit', () => {
    const onSubmit = vi.fn();
    renderMarkdown('@url site: Site', { onSubmit });
    fireEvent.change(screen.getByLabelText('Site'), { target: { value: 'notaurl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Enter a valid URL')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts URL with http scheme', () => {
    const onSubmit = vi.fn();
    renderMarkdown('@url site: Site', { onSubmit });
    fireEvent.change(screen.getByLabelText('Site'), { target: { value: 'http://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows error for phone number that is too short', () => {
    const onSubmit = vi.fn();
    renderMarkdown('@tel phone: Phone', { onSubmit });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts phone number with enough digits', () => {
    const onSubmit = vi.fn();
    renderMarkdown('@tel phone: Phone', { onSubmit });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+1-555-123-4567' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows prefill value for typed input', () => {
    renderMarkdown('@email em: Email || alice@example.com');
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
  });

  it('renders color input with type="color"', () => {
    renderMarkdown('@color bg: Background');
    expect(screen.getByLabelText('Background')).toHaveAttribute('type', 'color');
  });

  it('shows integer-formatted number on blur', () => {
    renderMarkdown('@number amount: Amount @integer');
    const input = screen.getByLabelText('Amount');
    fireEvent.change(input, { target: { value: '1234.7' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('1,235');
  });
});
