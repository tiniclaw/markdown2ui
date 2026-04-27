import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

const SINGLE = `color!: Pick a color
- Red
- Green
- Blue`;

const SINGLE_OPTIONAL = `lang: Preferred language
- Kotlin
- Java
- Swift`;

describe('SingleSelect', () => {
  it('renders all options as radio buttons', () => {
    renderMarkdown(SINGLE);
    expect(screen.getByRole('radio', { name: 'Red' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Green' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeInTheDocument();
  });

  it('renders label', () => {
    renderMarkdown(SINGLE);
    expect(screen.getByText('Pick a color')).toBeInTheDocument();
  });

  it('first option is selected by default', () => {
    renderMarkdown(SINGLE);
    expect(screen.getByRole('radio', { name: 'Red' })).toBeChecked();
  });

  it('changes selection on click', () => {
    renderMarkdown(SINGLE);
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Red' })).not.toBeChecked();
  });

  it('hides freestyle input when required', () => {
    renderMarkdown(SINGLE);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows freestyle input when not required', () => {
    renderMarkdown(SINGLE_OPTIONAL);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows hint when provided', () => {
    const src = `Pick your language
- Kotlin
- Swift
// Choose the one you use most`;
    renderMarkdown(src);
    expect(screen.getByText('Choose the one you use most')).toBeInTheDocument();
  });

  it('calls onSubmit with selected value', () => {
    const onSubmit = vi.fn();
    renderMarkdown(`color!: Favorite color\n- Red\n- Green`, { onSubmit, format: 'verbose' });
    fireEvent.click(screen.getByRole('radio', { name: 'Green' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalled();
    const [result] = onSubmit.mock.calls[0];
    expect((result as any).color.value).toBe('Green');
  });

  it('respects explicit (default) marker on a non-first option', () => {
    renderMarkdown(`lang: Language\n- Kotlin\n- Java (default)\n- Swift`);
    expect(screen.getByRole('radio', { name: 'Java' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Kotlin' })).not.toBeChecked();
  });

  it('submits default value when no user interaction occurs', () => {
    const onSubmit = vi.fn();
    renderMarkdown(`color!: Color\n- Red\n- Green`, { onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    expect(result as string).toContain('[color] Red');
  });

  it('freestyle input value propagates to submit output', () => {
    const onSubmit = vi.fn();
    renderMarkdown(`lang: Language\n- Kotlin\n- Java`, { onSubmit });
    const freestyle = screen.getByRole('textbox');
    fireEvent.change(freestyle, { target: { value: 'Haskell' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    expect(result as string).toContain('Haskell');
  });

  it('shows image when option has leading image syntax', () => {
    const { container } = renderMarkdown(
      `destination: Where?\n- ![Paris](https://example.com/paris.jpg) Paris\n- London`
    );
    expect(container.querySelector('img')).toBeInTheDocument();
  });
});
