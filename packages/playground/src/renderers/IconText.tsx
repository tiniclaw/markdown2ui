import { useMemo } from 'react';
import { processText, processTextGroup, type IconElement } from '@markdown2ui/react';
import { faResolver, isFaIcon, getFaClass } from './icons';

function renderIcon(icon: IconElement) {
  if (!icon) return null;

  if (isFaIcon(icon)) {
    return <i className={getFaClass(icon)} style={{ marginRight: 6, width: 16, textAlign: 'center', display: 'inline-block' }} />;
  }

  if (typeof icon === 'string') {
    return <span style={{ marginRight: 4 }}>{icon}</span>;
  }

  if (icon.type === 'img') {
    return <img src={icon.src} alt={icon.alt} style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} />;
  }

  return null;
}

/**
 * Renders a single text item with leading icon support.
 */
export function IconText({ text }: { text: string }) {
  const { icon, text: rest } = processText(text, faResolver);
  return <>{renderIcon(icon ?? null)}{rest}</>;
}

/**
 * Hook: process a group of texts with consistent icon resolution.
 * If any :name: icon fails to resolve from FA, ALL drop their icons.
 */
export function useGroupIcons(texts: string[]): Array<{ icon?: IconElement; text: string }> {
  return useMemo(() => processTextGroup(texts, faResolver), [texts]);
}
