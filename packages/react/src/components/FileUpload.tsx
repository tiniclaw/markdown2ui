import { useRef } from 'react';
import { useFormContext } from '../context.js';
import type { FileUploadBlock, ImageUploadBlock } from '@markdown2ui/parser';

type UploadBlock = FileUploadBlock | ImageUploadBlock;

export function FileUpload({ block }: { block: UploadBlock }) {
  const { values, setValue, errors } = useFormContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const value = values[block.id!] as string | undefined;
  const error = errors[block.id!];

  const isImage = block.type === 'image-upload';
  const accept = isImage
    ? 'image/*'
    : (block as FileUploadBlock).extensions?.join(',') || undefined;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setValue(block.id!, file.name);
    }
  }

  function handleRemove() {
    setValue(block.id!, undefined);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="m2u-card">
      <label className="m2u-label">
        {block.label}
        {block.required && <span className="m2u-required" aria-hidden="true"> *</span>}
      </label>
      {value ? (
        <div className="m2u-upload-preview">
          <span className="m2u-upload-filename">{isImage ? '🖼️ ' : '📄 '}{value}</span>
          <button type="button" className="m2u-upload-remove" onClick={handleRemove}>✕</button>
        </div>
      ) : (
        <div className="m2u-upload-area" onClick={() => fileRef.current?.click()}>
          <span className="m2u-upload-icon">{isImage ? '📷' : '📁'}</span>
          <span className="m2u-upload-text">
            {isImage ? 'Upload image' : 'Upload file'}
          </span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        capture={isImage ? 'environment' : undefined}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {error && <p className="m2u-error">{error}</p>}
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
