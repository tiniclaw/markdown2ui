import { useFormContext } from '../context.js';
import type { SequenceBlock } from '@markdown2ui/parser';

export function Sequence({ block }: { block: SequenceBlock }) {
  const { values, setValue } = useFormContext();
  const items = (values[block.id!] as string[]) || block.items;

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setValue(block.id!, next);
  }

  return (
    <div className="m2u-card">
      <label className="m2u-label">{block.label}</label>
      <ul className="m2u-sequence" role="list" aria-roledescription="reorderable list" aria-label={block.label}>
        {items.map((item, index) => (
          <li key={item} className="m2u-sequence-item" draggable>
            <span className="m2u-drag-handle" aria-hidden="true">⠿</span>
            <span className="m2u-sequence-text">{item}</span>
            <span className="m2u-sequence-controls">
              <button
                type="button"
                aria-label={`Move ${item} up`}
                disabled={index === 0}
                onClick={() => moveItem(index, index - 1)}
              >↑</button>
              <button
                type="button"
                aria-label={`Move ${item} down`}
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, index + 1)}
              >↓</button>
            </span>
          </li>
        ))}
      </ul>
      {block.hint && <p className="m2u-hint">{block.hint}</p>}
    </div>
  );
}
