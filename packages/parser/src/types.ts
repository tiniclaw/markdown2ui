export interface AST {
  version: '1.0';
  blocks: Block[];
}

export interface SingleSelectOption {
  text: string;
  default: boolean;
  image?: string;
}

export interface MultiSelectOption {
  text: string;
  selected: boolean;
  required?: boolean;
  image?: string;
}

export type ConditionOperator = '==' | '!=';

export interface Condition {
  fieldId: string;
  op: ConditionOperator;
  value: string;
}

interface BaseBlock {
  type: string;
  id?: string;
  required?: boolean;
  hint?: string;
  condition?: Condition;
}

export interface SingleSelectBlock extends BaseBlock {
  type: 'single-select';
  label: string;
  options: SingleSelectOption[];
}

export interface MultiSelectBlock extends BaseBlock {
  type: 'multi-select';
  label: string;
  options: MultiSelectOption[];
}

export interface SequenceBlock extends BaseBlock {
  type: 'sequence';
  label: string;
  items: string[];
}

export interface ConfirmationBlock extends BaseBlock {
  type: 'confirmation';
  label: string;
  yesLabel: string;
  noLabel: string;
}

export interface TextInputBlock extends BaseBlock {
  type: 'text-input';
  label: string;
  multiline: boolean;
  placeholder?: string;
  prefill?: string;
}

export type FormatAnnotation =
  | { type: 'currency'; code: string }
  | { type: 'unit'; unit: string; plural?: string }
  | { type: 'percent' }
  | { type: 'integer' }
  | { type: 'decimal'; places: number };

export type TypedInputFormat =
  | 'email' | 'tel' | 'url' | 'number' | 'password' | 'color';

export interface TypedInputBlock extends BaseBlock {
  type: 'typed-input';
  label: string;
  format: TypedInputFormat;
  placeholder?: string;
  prefill?: string;
  displayFormat?: FormatAnnotation;
}

export interface SliderBlock extends BaseBlock {
  type: 'slider';
  label: string;
  min: number;
  max: number;
  default: number;
  step?: number;
  displayFormat?: FormatAnnotation;
}

export interface DateBlock extends BaseBlock {
  type: 'date';
  label: string;
  default: string;
}

export interface TimeBlock extends BaseBlock {
  type: 'time';
  label: string;
  default: string;
}

export interface DatetimeBlock extends BaseBlock {
  type: 'datetime';
  label: string;
  default: string;
}

export interface FileUploadBlock extends BaseBlock {
  type: 'file-upload';
  label: string;
  extensions?: string[];
}

export interface ImageUploadBlock extends BaseBlock {
  type: 'image-upload';
  label: string;
}

export interface HeaderBlock {
  type: 'header';
  level: 1 | 2;
  text: string;
}

export interface HintBlock {
  type: 'hint';
  text: string;
}

export interface DividerBlock {
  type: 'divider';
}

export interface ProseBlock {
  type: 'prose';
  text: string;
}

export interface GroupBlock {
  type: 'group';
  name?: string;
  id?: string;
  children: Block[];
  repeatable?: true;
  minRows?: number;
  maxRows?: number;
}

export type TableColumnType =
  | { kind: 'text' }
  | { kind: 'number'; format?: FormatAnnotation };

export interface TableColumn {
  id: string;
  label: string;
  columnType: TableColumnType;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  label?: string;
  columns: TableColumn[];
  minRows?: number;
  maxRows?: number;
}

export type ComputedExpression =
  | { type: 'sum'; fields: string[] }
  | { type: 'count'; fields: string[] };

export interface ComputedBlock extends BaseBlock {
  type: 'computed';
  label: string;
  expression: ComputedExpression;
  displayFormat?: FormatAnnotation;
}

export interface CustomBlock extends BaseBlock {
  type: 'custom';
  customType: string;
  payload: Record<string, unknown>;
}

export type Block =
  | SingleSelectBlock
  | MultiSelectBlock
  | SequenceBlock
  | ConfirmationBlock
  | TextInputBlock
  | TypedInputBlock
  | SliderBlock
  | DateBlock
  | TimeBlock
  | DatetimeBlock
  | FileUploadBlock
  | ImageUploadBlock
  | HeaderBlock
  | HintBlock
  | DividerBlock
  | ProseBlock
  | GroupBlock
  | TableBlock
  | ComputedBlock
  | CustomBlock;
