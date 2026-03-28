import type { GroupBlock } from '@markdown2ui/parser';
import { BlockRenderer } from './BlockRenderer.js';

export function Group({ block }: { block: GroupBlock }) {
  return (
    <div className="m2u-group" role="group" aria-label={block.name}>
      {block.children.map((child, i) => (
        <BlockRenderer key={i} block={child} />
      ))}
    </div>
  );
}
