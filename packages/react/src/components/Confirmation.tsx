import { useFormContext } from '../context.js';
import type { ConfirmationBlock } from '@markdown2ui/parser';

export function Confirmation({ block }: { block: ConfirmationBlock }) {
  const { values, setValue, onSubmit } = useFormContext();
  const confirmed = values[block.id!] === true;

  return (
    <div className="m2u-confirmation">
      <p className="m2u-confirmation-label">{block.label}</p>
      <div className="m2u-confirmation-buttons">
        <button
          type="button"
          className={`m2u-btn ${confirmed ? 'm2u-btn--secondary' : 'm2u-btn--primary m2u-btn--active'}`}
          onClick={() => setValue(block.id!, false)}
        >
          {block.noLabel}
        </button>
        <button
          type="button"
          className={`m2u-btn ${confirmed ? 'm2u-btn--primary m2u-btn--active' : 'm2u-btn--secondary'}`}
          onClick={() => {
            setValue(block.id!, true);
            if (onSubmit) onSubmit();
          }}
        >
          {block.yesLabel}
        </button>
      </div>
    </div>
  );
}
