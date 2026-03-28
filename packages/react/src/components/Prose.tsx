import type { ProseBlock } from '@markdown2ui/parser';

export function Prose({ block }: { block: ProseBlock }) {
  return <p className="m2u-prose">{block.text}</p>;
}
