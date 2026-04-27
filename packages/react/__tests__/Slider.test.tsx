import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

describe('Slider', () => {
  it('renders with label', () => {
    renderMarkdown('~ How many items? [1 - 100] (10)');
    expect(screen.getByText('How many items?')).toBeInTheDocument();
  });

  it('renders an input of type range', () => {
    renderMarkdown('~ How many items? [1 - 100] (10)');
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('sets min, max, and default value', () => {
    renderMarkdown('~ Rating [0 - 10] (5)');
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '10');
    expect(slider).toHaveValue('5');
  });

  it('has aria attributes', () => {
    renderMarkdown('~ Rating [0 - 10] (5)');
    const slider = screen.getByRole('slider', { name: 'Rating' });
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '10');
    expect(slider).toHaveAttribute('aria-valuenow', '5');
  });

  it('shows current value as text', () => {
    renderMarkdown('~ Count [1 - 100] (25)');
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('updates displayed value when slider moves', () => {
    renderMarkdown('~ Count [1 - 100] (25)');
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('shows currency-formatted value', () => {
    renderMarkdown('~ Budget [100 - 10000] (1000) @currency(USD)');
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
  });

  it('shows percentage-formatted value', () => {
    renderMarkdown('~ Completion [0 - 100] (50) @percent');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows hint when provided', () => {
    renderMarkdown('~ Budget [100 - 10000] (500)\n// Slide to set your budget');
    expect(screen.getByText('Slide to set your budget')).toBeInTheDocument();
  });

  it('sets step attribute when %step is specified', () => {
    renderMarkdown('~ Budget [0 - 100] (50) %10');
    expect(screen.getByRole('slider')).toHaveAttribute('step', '10');
  });

  it('shows singular unit label at value 1', () => {
    // min=0 so min label shows "0 items", value display shows "1 item" — unambiguous
    renderMarkdown('~ count: Count [0 - 10] (1) @unit(item|items)');
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('shows plural unit label at value > 1', () => {
    renderMarkdown('~ count: Count [0 - 10] (3) @unit(item|items)');
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('shows decimal-formatted value', () => {
    renderMarkdown('~ rate: Rate [0 - 1] (0.5) @decimal(2)');
    expect(screen.getByText('0.50')).toBeInTheDocument();
  });

  it('updates aria-valuenow when slider changes', () => {
    renderMarkdown('~ vol: Volume [0 - 100] (50)');
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });
    expect(slider).toHaveAttribute('aria-valuenow', '80');
  });

  it('serializes slider default value without user interaction', () => {
    const onSubmit = vi.fn();
    renderMarkdown('~ rating: Rating [1 - 10] (7)', { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    expect(result as string).toContain('[rating] 7');
  });
});
