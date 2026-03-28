import { useMemo } from 'react';
import { Markdown2UI } from '@markdown2ui/react';
import type { AST, Block } from '@markdown2ui/parser';
import type { RendererProps } from './types';

/**
 * Emoji fallback map for :name: icons.
 * The Plain renderer can't render FA <i> tags inside Markdown2UI,
 * so we resolve :name: to emoji before passing the AST.
 */
const EMOJI_MAP: Record<string, string> = {
  home: '🏠', search: '🔍', settings: '⚙️', edit: '✏️', delete: '🗑️',
  add: '➕', remove: '➖', close: '✕', check: '✓',
  email: '✉️', phone: '📞', chat: '💬', notification: '🔔', send: '📨',
  person: '👤', people: '👥', lock: '🔒', key: '🔑',
  file: '📄', folder: '📁', image: '🖼️', camera: '📷', upload: '⬆️', download: '⬇️',
  star: '⭐', heart: '❤️', flag: '🚩', info: 'ℹ️', warning: '⚠️', error: '❌', success: '✅',
  calendar: '📅', clock: '🕐', location: '📍', globe: '🌐',
  cart: '🛒', payment: '💳', money: '💰', gift: '🎁',
  car: '🚗', train: '🚆', plane: '✈️', bus: '🚌', bike: '🚲',
  sun: '☀️', moon: '🌙', fire: '🔥', light: '💡',
};

const ICON_RE = /:([a-z][a-z0-9_]*):/g;

function resolveText(text: string): string {
  return text.replace(ICON_RE, (match, name) => EMOJI_MAP[name] ?? match);
}

function resolveBlock(block: Block): Block {
  const b = block as any;
  const r = resolveText;

  switch (block.type) {
    case 'single-select':
      return { ...b, label: r(b.label), options: b.options.map((o: any) => ({ ...o, text: r(o.text) })) };
    case 'multi-select':
      return { ...b, label: r(b.label), options: b.options.map((o: any) => ({ ...o, text: r(o.text) })) };
    case 'sequence':
      return { ...b, label: r(b.label), items: b.items.map(r) };
    case 'header':
      return { ...b, text: r(b.text) };
    case 'confirmation':
      return { ...b, label: r(b.label), yesLabel: r(b.yesLabel), noLabel: r(b.noLabel) };
    case 'text-input':
    case 'typed-input':
      return { ...b, label: r(b.label) };
    case 'prose':
      return { ...b, text: r(b.text) };
    case 'group':
      return { ...b, children: b.children.map(resolveBlock) };
    default:
      if (b.label) return { ...b, label: r(b.label) };
      return block;
  }
}

export function PlainRenderer({ ast, onSubmit }: RendererProps) {
  const resolved = useMemo<AST>(() => ({
    ...ast,
    blocks: ast.blocks.map(resolveBlock),
  }), [ast]);

  return (
    <Markdown2UI
      source={resolved}
      onSubmit={(result) => onSubmit?.(result as string)}
    />
  );
}
