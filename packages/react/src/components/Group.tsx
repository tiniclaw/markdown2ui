import type { GroupBlock } from '@markdown2ui/parser';
import { FormContext, useFormContext, type FormContextValue } from '../context.js';
import { BlockRenderer } from './BlockRenderer.js';

// Repeatable groups may have an explicit id (from DSL) or a name — use whichever is available.
function groupKey(block: GroupBlock): string | undefined {
  return block.id ?? block.name;
}

function RepeatableGroupRow({
  block,
  storageKey,
  rowIndex,
  rowValues,
  canRemove,
  onRemove,
}: {
  block: GroupBlock;
  storageKey: string;
  rowIndex: number;
  rowValues: Record<string, any>;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const parent = useFormContext();

  const rowContext: FormContextValue = {
    values: rowValues,
    setValue: (fieldId, value) => parent.setGroupValue(storageKey, rowIndex, fieldId, value),
    errors: {},
    onSubmit: parent.onSubmit,
    setGroupValue: parent.setGroupValue,
    blockRenderers: parent.blockRenderers,
    strings: parent.strings,
  };

  return (
    <FormContext.Provider value={rowContext}>
      <div className="m2u-group-row">
        {block.children.map((child, i) => (
          <BlockRenderer key={i} block={child} />
        ))}
        {canRemove && (
          <button
            type="button"
            className="m2u-group-row-remove"
            onClick={onRemove}
            aria-label={parent.strings.removeItem}
          >
            {parent.strings.removeItem}
          </button>
        )}
      </div>
    </FormContext.Provider>
  );
}

export function Group({ block }: { block: GroupBlock }) {
  const { values, setValue, strings } = useFormContext();

  if (!block.repeatable) {
    return (
      <div className="m2u-group" role="group" aria-label={block.name}>
        {block.children.map((child, i) => (
          <BlockRenderer key={i} block={child} />
        ))}
      </div>
    );
  }

  const key = groupKey(block) ?? '__group__';
  const rows = (values[key] as Array<Record<string, any>>) ?? [{}];
  const minRows = block.minRows ?? 1;
  const maxRows = block.maxRows;

  function addRow() {
    setValue(key, [...rows, {}]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    setValue(key, next.length > 0 ? next : [{}]);
  }

  return (
    <div className="m2u-group m2u-group--repeatable" role="group" aria-label={block.name}>
      {rows.map((row, rowIndex) => (
        <RepeatableGroupRow
          key={rowIndex}
          block={block}
          storageKey={key}
          rowIndex={rowIndex}
          rowValues={row}
          canRemove={rows.length > minRows}
          onRemove={() => removeRow(rowIndex)}
        />
      ))}
      {(!maxRows || rows.length < maxRows) && (
        <button type="button" className="m2u-group-add" onClick={addRow}>
          {strings.addItem}
        </button>
      )}
    </div>
  );
}
