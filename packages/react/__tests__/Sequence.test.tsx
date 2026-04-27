import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

const SEQ = `Priority
1. Speed
2. Cost
3. Reliability`;

describe('Sequence', () => {
  it('renders all items', () => {
    renderMarkdown(SEQ);
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
    expect(screen.getByText('Reliability')).toBeInTheDocument();
  });

  it('renders label', () => {
    renderMarkdown(SEQ);
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('disables Up button for first item', () => {
    renderMarkdown(SEQ);
    const upButtons = screen.getAllByRole('button', { name: /Move .* up/ });
    expect(upButtons[0]).toBeDisabled();
  });

  it('disables Down button for last item', () => {
    renderMarkdown(SEQ);
    const downButtons = screen.getAllByRole('button', { name: /Move .* down/ });
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });

  it('enables Up and Down for middle items', () => {
    renderMarkdown(SEQ);
    const upButtons = screen.getAllByRole('button', { name: /Move .* up/ });
    const downButtons = screen.getAllByRole('button', { name: /Move .* down/ });
    expect(upButtons[1]).not.toBeDisabled();
    expect(downButtons[1]).not.toBeDisabled();
  });

  it('moves an item up when Up is clicked', () => {
    renderMarkdown(SEQ);
    // Click "Move Cost up" — Cost should now be before Speed
    const upButtons = screen.getAllByRole('button', { name: /Move .* up/ });
    fireEvent.click(upButtons[1]); // Up for "Cost" (index 1)
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Cost');
    expect(items[1]).toHaveTextContent('Speed');
  });

  it('moves an item down when Down is clicked', () => {
    renderMarkdown(SEQ);
    // Click "Move Speed down" — Speed should now be after Cost
    const downButtons = screen.getAllByRole('button', { name: /Move .* down/ });
    fireEvent.click(downButtons[0]); // Down for "Speed" (index 0)
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Cost');
    expect(items[1]).toHaveTextContent('Speed');
  });

  it('disables both Up and Down for a single-item sequence', () => {
    renderMarkdown(`Solo\n1. Alone`);
    expect(screen.getByRole('button', { name: /Move .* up/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Move .* down/ })).toBeDisabled();
  });

  it('submits reordered sequence in the new order', () => {
    const onSubmit = vi.fn();
    renderMarkdown(SEQ, { onSubmit, format: 'verbose' });
    // Move "Cost" up (index 1 → 0)
    fireEvent.click(screen.getAllByRole('button', { name: /Move .* up/ })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const [result] = onSubmit.mock.calls[0];
    const order = (result as any).priority.value;
    expect(order[0]).toBe('Cost');
    expect(order[1]).toBe('Speed');
  });

  it('supports multiple sequential moves', () => {
    renderMarkdown(SEQ);
    // Move Speed down twice: Speed → end
    fireEvent.click(screen.getAllByRole('button', { name: /Move .* down/ })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Move .* down/ })[1]);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Cost');
    expect(items[1]).toHaveTextContent('Reliability');
    expect(items[2]).toHaveTextContent('Speed');
  });
});
