import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

describe('Header', () => {
  it('renders level-1 header as h2 element', () => {
    renderMarkdown('# My Form Title');
    const heading = screen.getByRole('heading', { name: 'My Form Title' });
    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveClass('m2u-h1');
  });

  it('renders level-2 header as h3 element', () => {
    renderMarkdown('## Section Title');
    const heading = screen.getByRole('heading', { name: 'Section Title' });
    expect(heading.tagName).toBe('H3');
    expect(heading).toHaveClass('m2u-h2');
  });

  it('renders header text content', () => {
    renderMarkdown('# Choose your preferences');
    expect(screen.getByText('Choose your preferences')).toBeInTheDocument();
  });
});

describe('Prose', () => {
  it('renders prose as a paragraph', () => {
    renderMarkdown('Here is some explanatory text.');
    const para = screen.getByText('Here is some explanatory text.');
    expect(para.tagName).toBe('P');
  });

  it('applies m2u-prose class', () => {
    renderMarkdown('Some info here.');
    expect(screen.getByText('Some info here.')).toHaveClass('m2u-prose');
  });
});

describe('Divider', () => {
  it('renders a divider element', () => {
    const { container } = renderMarkdown('---');
    expect(container.querySelector('.m2u-divider')).toBeInTheDocument();
  });
});
