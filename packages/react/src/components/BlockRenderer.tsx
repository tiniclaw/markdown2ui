import type { Block } from '@markdown2ui/parser';
import { useFormContext } from '../context.js';
import { isBlockVisible } from './Markdown2UI.js';
import { SingleSelect } from './SingleSelect.js';
import { MultiSelect } from './MultiSelect.js';
import { Sequence } from './Sequence.js';
import { Confirmation } from './Confirmation.js';
import { TextInput } from './TextInput.js';
import { TypedInput } from './TypedInput.js';
import { Slider } from './Slider.js';
import { DatePicker } from './DatePicker.js';
import { FileUpload } from './FileUpload.js';
import { Header } from './Header.js';
import { Prose } from './Prose.js';
import { Divider } from './Divider.js';
import { Group } from './Group.js';
import { TableInput } from './TableInput.js';
import { ComputedField } from './ComputedField.js';

export function BlockRenderer({ block }: { block: Block }) {
  const { values, blockRenderers } = useFormContext();

  // Plugin renderers take priority over built-ins
  const CustomRenderer = blockRenderers?.[block.type];
  if (CustomRenderer) return <CustomRenderer block={block} />;

  // Evaluate condition — return null if block should be hidden
  if (!isBlockVisible(block, values)) return null;

  switch (block.type) {
    case 'single-select':
      return <SingleSelect block={block} />;
    case 'multi-select':
      return <MultiSelect block={block} />;
    case 'sequence':
      return <Sequence block={block} />;
    case 'confirmation':
      return <Confirmation block={block} />;
    case 'text-input':
      return <TextInput block={block} />;
    case 'typed-input':
      return <TypedInput block={block} />;
    case 'slider':
      return <Slider block={block} />;
    case 'date':
    case 'time':
    case 'datetime':
      return <DatePicker block={block} />;
    case 'file-upload':
    case 'image-upload':
      return <FileUpload block={block} />;
    case 'header':
      return <Header block={block} />;
    case 'prose':
      return <Prose block={block} />;
    case 'divider':
      return <Divider />;
    case 'group':
      return <Group block={block} />;
    case 'hint':
      return <p className="m2u-hint">{block.text}</p>;
    case 'table':
      return <TableInput block={block} />;
    case 'computed':
      return <ComputedField block={block} />;
    case 'custom':
      // Custom blocks without a registered renderer are silently skipped
      return null;
    default:
      return null;
  }
}
