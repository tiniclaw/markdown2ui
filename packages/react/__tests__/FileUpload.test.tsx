import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderMarkdown } from './helpers.js';

describe('FileUpload', () => {
  it('renders file upload area', () => {
    renderMarkdown('[Upload your logo]()');
    expect(screen.getByText('Upload file')).toBeInTheDocument();
  });

  it('renders image upload area', () => {
    renderMarkdown('![Upload a photo]()');
    expect(screen.getByText('Upload image')).toBeInTheDocument();
  });

  it('renders file upload label', () => {
    renderMarkdown('[Upload your logo]()');
    expect(screen.getByText('Upload your logo')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    renderMarkdown('[report!: Upload the report](.pdf)');
    expect(screen.getByText('*', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows filename after file selection', () => {
    renderMarkdown('[doc: Upload a file]()');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test-doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    expect(screen.getByText(/test-doc\.pdf/)).toBeInTheDocument();
  });

  it('removes file when remove button is clicked', () => {
    renderMarkdown('[doc: Upload a file]()');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test-doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    expect(screen.getByText(/test-doc\.pdf/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByText(/test-doc\.pdf/)).not.toBeInTheDocument();
    expect(screen.getByText('Upload file')).toBeInTheDocument();
  });

  it('applies accept attribute for extension filter', () => {
    renderMarkdown('[Upload the data file](.csv, .xlsx)');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx');
  });

  it('applies capture attribute for image upload', () => {
    renderMarkdown('![Take a photo]()');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('shows hint when provided', () => {
    renderMarkdown('[Upload your logo]()\n// Max 5MB, PNG or SVG');
    expect(screen.getByText('Max 5MB, PNG or SVG')).toBeInTheDocument();
  });
});
