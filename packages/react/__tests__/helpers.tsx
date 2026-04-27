import { render } from '@testing-library/react';
import { Markdown2UI } from '../src/components/Markdown2UI.js';
import type { Markdown2UIProps } from '../src/components/Markdown2UI.js';

export function renderMarkdown(source: string, props?: Partial<Omit<Markdown2UIProps, 'source'>>) {
  return render(<Markdown2UI source={source} {...props} />);
}
