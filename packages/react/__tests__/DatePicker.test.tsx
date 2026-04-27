import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

describe('DatePicker', () => {
  it('renders a date input for @date', () => {
    renderMarkdown('@date When to schedule?');
    expect(screen.getByLabelText('When to schedule?')).toHaveAttribute('type', 'date');
  });

  it('renders a time input for @time', () => {
    renderMarkdown('@time Meeting time');
    expect(screen.getByLabelText('Meeting time')).toHaveAttribute('type', 'time');
  });

  it('renders a datetime-local input for @datetime', () => {
    renderMarkdown('@datetime When exactly?');
    expect(screen.getByLabelText('When exactly?')).toHaveAttribute('type', 'datetime-local');
  });

  it('uses custom default value when specified', () => {
    renderMarkdown('@date checkin: Check-in date | 2026-03-26');
    expect(screen.getByLabelText('Check-in date')).toHaveValue('2026-03-26');
  });

  it('defaults to today for @date without explicit default', () => {
    renderMarkdown('@date When to schedule?');
    const input = screen.getByLabelText('When to schedule?');
    const today = new Date().toISOString().slice(0, 10);
    expect(input).toHaveValue(today);
  });

  it('updates value on change', () => {
    renderMarkdown('@date When to schedule?');
    const input = screen.getByLabelText('When to schedule?');
    fireEvent.change(input, { target: { value: '2027-01-01' } });
    expect(input).toHaveValue('2027-01-01');
  });

  it('shows required asterisk when required', () => {
    renderMarkdown('@date date!: Start date');
    expect(screen.getByText('*', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows hint when provided', () => {
    renderMarkdown('@date When to schedule?\n// Choose a weekday');
    expect(screen.getByText('Choose a weekday')).toBeInTheDocument();
  });

  it('shows locale-formatted date display for @date', () => {
    const { container } = renderMarkdown('@date checkin: Check-in | 2027-06-15');
    const display = container.querySelector('.m2u-date-display');
    expect(display).toBeInTheDocument();
    // Locale format varies by environment, but should contain the year
    expect(display?.textContent).toContain('2027');
  });

  it('updates locale display when date input changes', () => {
    const { container } = renderMarkdown('@date appt: Appointment | 2026-01-01');
    fireEvent.change(screen.getByLabelText('Appointment'), { target: { value: '2028-12-25' } });
    const display = container.querySelector('.m2u-date-display');
    expect(display?.textContent).toContain('2028');
  });

  it('does NOT show locale display for @time', () => {
    const { container } = renderMarkdown('@time t: Time');
    expect(container.querySelector('.m2u-date-display')).not.toBeInTheDocument();
  });

  it('shows locale-formatted display for @datetime', () => {
    const { container } = renderMarkdown('@datetime appt: Appointment | 2027-06-15T14:30');
    const display = container.querySelector('.m2u-date-display');
    expect(display).toBeInTheDocument();
    expect(display?.textContent).toContain('2027');
  });

  it('has aria-live="polite" on locale display', () => {
    const { container } = renderMarkdown('@date appt: Appointment | 2027-06-15');
    const display = container.querySelector('.m2u-date-display');
    expect(display).toHaveAttribute('aria-live', 'polite');
  });
});
