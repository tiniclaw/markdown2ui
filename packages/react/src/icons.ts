/**
 * Icon resolution for markdown2ui.
 *
 * The renderer owns icon resolution entirely. This module provides
 * utilities for extracting icon references from text and a pluggable
 * resolution chain:
 *
 * 1. Extract leading emoji from text (renderer decides to use or ignore)
 * 2. If :name: found → look for asset file (e.g., icons/car.svg)
 * 3. If no asset → try icon library (Font Awesome, Material Icons, etc.)
 * 4. If nothing → show text as-is (graceful fallback)
 */

// ─── Leading symbol extraction ──────────────────────────────────────

// Matches leading emoji (including compound emoji with ZWJ, skin tones, etc.)
const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/u;

// Matches a single non-ASCII character followed by a space (한글, special chars, etc.)
// Also matches single special ASCII symbols (★, ♦, etc.) that aren't letters/digits.
const SINGLE_SYMBOL_REGEX = /^([^\w\s]|[^\x00-\x7F])\s+/u;

/**
 * Extract a leading emoji from text.
 * Returns { emoji, text } where emoji is the extracted character(s)
 * and text is the remaining string (trimmed).
 */
export function extractLeadingEmoji(text: string): { emoji?: string; text: string } {
  const match = text.match(EMOJI_REGEX);
  if (match) {
    const emoji = match[0];
    const rest = text.slice(emoji.length).trimStart();
    return { emoji, text: rest };
  }
  return { text };
}

/**
 * Extract a leading symbol from text.
 * Broader than extractLeadingEmoji — also matches single non-ASCII characters
 * (한글, special chars like ★, ♦, Ω) and single non-alphanumeric ASCII chars.
 * Does NOT match ASCII letters or digits (to avoid "A Apple" → icon "A").
 */
export function extractLeadingSymbol(text: string): { symbol?: string; text: string } {
  // Try emoji first (multi-char emoji like compound ZWJ sequences)
  const emojiResult = extractLeadingEmoji(text);
  if (emojiResult.emoji) {
    return { symbol: emojiResult.emoji, text: emojiResult.text };
  }

  // Try single symbol character
  const match = text.match(SINGLE_SYMBOL_REGEX);
  if (match) {
    return { symbol: match[1], text: text.slice(match[0].length) };
  }

  return { text };
}

// ─── Named icon extraction ──────────────────────────────────────────

const ICON_NAME_REGEX = /^:([a-z][a-z0-9_]*):\s*/;
const ICON_INLINE_REGEX = /:([a-z][a-z0-9_]*):/g;

/**
 * Extract a leading :icon_name: from text.
 * Returns { name, text } where name is the icon identifier
 * and text is the remaining string.
 */
export function extractLeadingIcon(text: string): { name?: string; text: string } {
  const match = text.match(ICON_NAME_REGEX);
  if (match) {
    return { name: match[1], text: text.slice(match[0].length) };
  }
  return { text };
}

/**
 * Extract all :icon_name: references from text.
 * Returns the names found and the text with :name: patterns intact.
 */
export function findIconNames(text: string): string[] {
  const names: string[] = [];
  let match;
  while ((match = ICON_INLINE_REGEX.exec(text)) !== null) {
    names.push(match[1]);
  }
  return names;
}

// ─── Icon resolution chain ──────────────────────────────────────────

export type IconElement = string | { type: 'img'; src: string; alt: string } | null;

export interface IconResolver {
  /**
   * Resolve an icon name to a renderable element.
   * Returns null if the icon cannot be resolved (falls through to next resolver).
   */
  resolve(name: string): IconElement;
}

/**
 * Asset-based resolver: looks for icon files in a base URL directory.
 * Tries .svg first, then .png.
 */
export function createAssetResolver(baseUrl: string, extensions = ['svg', 'png']): IconResolver {
  return {
    resolve(name: string): IconElement {
      // In a real app, you'd check if the file exists.
      // For now, return an img element pointing to the expected path.
      const ext = extensions[0] || 'svg';
      return { type: 'img', src: `${baseUrl}/${name}.${ext}`, alt: name };
    },
  };
}

/**
 * Map-based resolver: uses a lookup table of name → emoji/symbol.
 */
export function createMapResolver(map: Record<string, string>): IconResolver {
  return {
    resolve(name: string): IconElement {
      return map[name] ?? null;
    },
  };
}

/**
 * Chain multiple resolvers. First non-null result wins.
 */
export function chainResolvers(...resolvers: IconResolver[]): IconResolver {
  return {
    resolve(name: string): IconElement {
      for (const resolver of resolvers) {
        const result = resolver.resolve(name);
        if (result !== null) return result;
      }
      return null;
    },
  };
}

/**
 * Process text: extract leading emoji or :icon:, resolve through chain.
 * Returns { icon, text } where icon is the resolved element (or undefined)
 * and text is the remaining display text.
 */
export function processText(
  text: string,
  resolver?: IconResolver
): { icon?: IconElement; text: string } {
  // 1. Try extracting leading :icon_name:
  const iconResult = extractLeadingIcon(text);
  if (iconResult.name) {
    const resolved = resolver?.resolve(iconResult.name) ?? null;
    return { icon: resolved ?? `:${iconResult.name}:`, text: iconResult.text };
  }

  // 2. Try extracting leading symbol (emoji, 한글, special char, etc.)
  const symbolResult = extractLeadingSymbol(text);
  if (symbolResult.symbol) {
    return { icon: symbolResult.symbol, text: symbolResult.text };
  }

  // 3. No icon found
  return { text };
}

/**
 * Process a group of texts with consistent icon resolution.
 * If any icon in the group cannot be resolved from the primary resolver,
 * ALL icons in the group fall back to the same source.
 * This prevents mixing icon types (e.g., some FA + some emoji) within a group.
 */
export function processTextGroup(
  texts: string[],
  resolver?: IconResolver
): Array<{ icon?: IconElement; text: string }> {
  // First pass: try resolving all with the primary resolver
  const results = texts.map((t) => {
    const iconResult = extractLeadingIcon(t);
    if (iconResult.name) {
      const resolved = resolver?.resolve(iconResult.name) ?? null;
      return { icon: resolved, name: iconResult.name, text: iconResult.text, hasNamedIcon: true };
    }
    const symbolResult = extractLeadingSymbol(t);
    if (symbolResult.symbol) {
      return { icon: symbolResult.symbol as IconElement, name: undefined, text: symbolResult.text, hasNamedIcon: false };
    }
    return { icon: null, name: undefined, text: t, hasNamedIcon: false };
  });

  // Check if all named icons resolved from primary
  const namedIcons = results.filter((r) => r.hasNamedIcon);
  const allResolved = namedIcons.every((r) => r.icon !== null);

  if (!allResolved && namedIcons.length > 0) {
    // Some named icons failed — fall back ALL named icons to no icon
    return results.map((r) => {
      if (r.hasNamedIcon) {
        return { text: r.text }; // drop the icon entirely
      }
      return { icon: r.icon ?? undefined, text: r.text };
    });
  }

  return results.map((r) => ({
    icon: r.icon ?? undefined,
    text: r.text,
  }));
}

/**
 * Replace all inline :icon: patterns in text using the resolver.
 */
export function replaceInlineIcons(
  text: string,
  resolver?: IconResolver
): string {
  if (!resolver) return text;
  return text.replace(ICON_INLINE_REGEX, (match, name) => {
    const result = resolver.resolve(name);
    if (typeof result === 'string') return result;
    if (result && result.type === 'img') return `[${result.alt}]`;
    return match; // keep :name: as-is if unresolved
  });
}
