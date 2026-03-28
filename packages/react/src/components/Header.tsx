import type { HeaderBlock } from '@markdown2ui/parser';

export function Header({ block }: { block: HeaderBlock }) {
  if (block.level === 1) {
    return <h2 className="m2u-header m2u-h1">{block.text}</h2>;
  }
  return <h3 className="m2u-header m2u-h2">{block.text}</h3>;
}
