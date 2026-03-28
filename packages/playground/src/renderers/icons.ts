import { processText, type IconResolver, type IconElement } from '@markdown2ui/react';

export { processText };
export type { IconResolver, IconElement };

/**
 * Font Awesome icon name mapping.
 * Maps common markdown2ui icon names → Font Awesome class names.
 */
const FA_MAP: Record<string, string> = {
  // Navigation & Actions
  home: 'fa-solid fa-house',
  search: 'fa-solid fa-magnifying-glass',
  settings: 'fa-solid fa-gear',
  edit: 'fa-solid fa-pen',
  delete: 'fa-solid fa-trash',
  add: 'fa-solid fa-plus',
  remove: 'fa-solid fa-minus',
  close: 'fa-solid fa-xmark',
  check: 'fa-solid fa-check',
  back: 'fa-solid fa-arrow-left',
  forward: 'fa-solid fa-arrow-right',
  up: 'fa-solid fa-arrow-up',
  down: 'fa-solid fa-arrow-down',
  menu: 'fa-solid fa-bars',
  more: 'fa-solid fa-ellipsis',
  refresh: 'fa-solid fa-rotate',
  share: 'fa-solid fa-share-nodes',
  copy: 'fa-solid fa-copy',
  save: 'fa-solid fa-floppy-disk',
  download: 'fa-solid fa-download',
  upload: 'fa-solid fa-upload',
  link: 'fa-solid fa-link',
  external_link: 'fa-solid fa-up-right-from-square',

  // Communication
  email: 'fa-solid fa-envelope',
  phone: 'fa-solid fa-phone',
  chat: 'fa-solid fa-comment',
  notification: 'fa-solid fa-bell',
  send: 'fa-solid fa-paper-plane',

  // People & Account
  person: 'fa-solid fa-user',
  people: 'fa-solid fa-users',
  account: 'fa-solid fa-user',
  lock: 'fa-solid fa-lock',
  unlock: 'fa-solid fa-unlock',
  key: 'fa-solid fa-key',

  // Content
  file: 'fa-solid fa-file',
  folder: 'fa-solid fa-folder',
  image: 'fa-solid fa-image',
  camera: 'fa-solid fa-camera',
  video: 'fa-solid fa-video',
  music: 'fa-solid fa-music',
  document: 'fa-solid fa-file-lines',
  code: 'fa-solid fa-code',

  // Status
  info: 'fa-solid fa-circle-info',
  warning: 'fa-solid fa-triangle-exclamation',
  error: 'fa-solid fa-circle-xmark',
  success: 'fa-solid fa-circle-check',
  star: 'fa-solid fa-star',
  star_filled: 'fa-solid fa-star',
  heart: 'fa-solid fa-heart',
  flag: 'fa-solid fa-flag',

  // Time & Place
  calendar: 'fa-solid fa-calendar',
  clock: 'fa-solid fa-clock',
  location: 'fa-solid fa-location-dot',
  map: 'fa-solid fa-map',
  globe: 'fa-solid fa-globe',

  // Commerce
  cart: 'fa-solid fa-cart-shopping',
  payment: 'fa-solid fa-credit-card',
  money: 'fa-solid fa-money-bill',
  gift: 'fa-solid fa-gift',
  tag: 'fa-solid fa-tag',
  receipt: 'fa-solid fa-receipt',

  // Transport
  car: 'fa-solid fa-car',
  train: 'fa-solid fa-train',
  plane: 'fa-solid fa-plane',
  bus: 'fa-solid fa-bus',
  bike: 'fa-solid fa-bicycle',
  walk: 'fa-solid fa-person-walking',
  ship: 'fa-solid fa-ship',

  // Weather & Nature
  sun: 'fa-solid fa-sun',
  moon: 'fa-solid fa-moon',
  cloud: 'fa-solid fa-cloud',
  fire: 'fa-solid fa-fire',

  // Misc
  light: 'fa-solid fa-lightbulb',
  dark: 'fa-solid fa-moon',
  wifi: 'fa-solid fa-wifi',
  power: 'fa-solid fa-power-off',
};

/**
 * Font Awesome resolver.
 * Returns an HTML string with the FA <i> tag class.
 */
export const faResolver: IconResolver = {
  resolve(name: string): IconElement {
    const faClass = FA_MAP[name];
    if (!faClass) return null;
    // Return the FA class as a string marker — renderers interpret this
    return `__fa__${faClass}`;
  },
};

/**
 * Check if an icon element is a Font Awesome reference.
 */
export function isFaIcon(icon: IconElement): icon is string {
  return typeof icon === 'string' && icon.startsWith('__fa__');
}

/**
 * Get the Font Awesome class from an icon element.
 */
export function getFaClass(icon: string): string {
  return icon.replace('__fa__', '');
}

/**
 * Process text and return display-ready content with FA icon support.
 * For React renderers, use processIconReact instead.
 */
export function processIconTextSimple(text: string): string {
  const { icon, text: rest } = processText(text, faResolver);
  if (!icon) return rest;
  if (isFaIcon(icon)) {
    // For plain text contexts, use the name as fallback
    return `● ${rest}`;
  }
  if (typeof icon === 'string') return `${icon} ${rest}`;
  if (icon.type === 'img') return `[${icon.alt}] ${rest}`;
  return rest;
}
