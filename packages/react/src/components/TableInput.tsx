import { useState } from 'react';
import type { TableBlock, TableColumn, FormatAnnotation } from '@markdown2ui/parser';
import { useFormContext } from '../context.js';

function formatCellValue(value: string, format?: FormatAnnotation): string {
  if (!format || !value) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  switch (format.type) {
    case 'currency':
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: format.code,
          maximumFractionDigits: 0,
        }).format(num);
      } catch {
        return `${value} ${format.code}`;
      }
    case 'percent':
      return `${num.toLocaleString()}%`;
    case 'integer':
      return Math.round(num).toLocaleString();
    case 'decimal':
      return num.toLocaleString(undefined, {
        minimumFractionDigits: format.places,
        maximumFractionDigits: format.places,
      });
    default:
      return value;
  }
}

function TableCell({
  col,
  value,
  onChange,
}: {
  col: TableColumn;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  const isNumeric = col.columnType.kind === 'number';
  const format = col.columnType.kind === 'number' ? col.columnType.format : undefined;
  const displayValue = !focused && format ? formatCellValue(value, format) : value;

  return (
    <div className="m2u-table-cell" role="gridcell">
      <input
        type="text"
        inputMode={isNumeric ? 'numeric' : undefined}
        className="m2u-table-input"
        value={focused ? value : (displayValue ?? '')}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        aria-label={col.label}
      />
    </div>
  );
}

export function TableInput({ block }: { block: TableBlock }) {
  const { values, setValue, strings } = useFormContext();
  const rows = (values[(block as any).id] as Array<Record<string, string>>) ?? [{}];

  function addRow() {
    setValue((block as any).id, [...rows, {}]);
  }

  function removeRow(index: number) {
    setValue(
      (block as any).id,
      rows.filter((_, i) => i !== index)
    );
  }

  function setCellValue(rowIndex: number, colId: string, cellValue: string) {
    const next = rows.map((row, i) =>
      i === rowIndex ? { ...row, [colId]: cellValue } : row
    );
    setValue((block as any).id, next);
  }

  return (
    <div className="m2u-card m2u-table-card">
      {block.label && <label className="m2u-label">{block.label}</label>}
      <div className="m2u-table-wrapper" role="grid" aria-label={block.label}>
        <div className="m2u-table-header" role="row">
          {block.columns.map((col) => (
            <div key={col.id} className="m2u-table-th" role="columnheader">
              {col.label}
            </div>
          ))}
          <div className="m2u-table-th m2u-table-th--actions" />
        </div>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="m2u-table-row" role="row">
            {block.columns.map((col) => (
              <TableCell
                key={col.id}
                col={col}
                value={row[col.id] ?? ''}
                onChange={(v) => setCellValue(rowIndex, col.id, v)}
              />
            ))}
            <div className="m2u-table-cell m2u-table-cell--actions">
              <button
                type="button"
                className="m2u-table-remove"
                onClick={() => removeRow(rowIndex)}
                aria-label={strings.removeRow}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      {(!block.maxRows || rows.length < block.maxRows) && (
        <button type="button" className="m2u-table-add-row" onClick={addRow}>
          {strings.addRow}
        </button>
      )}
    </div>
  );
}
