export function deriveId(label: string): string {
  let id = label.toLowerCase();
  // Remove all non-ASCII characters
  id = id.replace(/[^\x00-\x7F]/g, '');
  // Replace non-alphanumeric with underscore
  id = id.replace(/[^a-z0-9]/g, '_');
  // Collapse consecutive underscores
  id = id.replace(/_{2,}/g, '_');
  // Strip leading and trailing underscores
  id = id.replace(/^_|_$/g, '');

  if (id === '' || /^[0-9]/.test(id)) {
    id = 'field_' + id;
  }

  return id;
}

export function resolveCollisions(ids: (string | undefined)[]): void {
  const seen = new Map<string, number>();

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (id === undefined) continue;

    if (seen.has(id)) {
      const count = seen.get(id)! + 1;
      seen.set(id, count);
      ids[i] = `${id}_${count}`;
    } else {
      seen.set(id, 1);
    }
  }
}

export interface IdInfo {
  id?: string;
  label: string;
  required: boolean;
}

export function extractIdFromText(text: string): IdInfo {
  // Try explicit id: id!: Label or id: Label
  const idMatch = text.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    return {
      id: idMatch[1],
      label: idMatch[3],
      required: idMatch[2] === '!',
    };
  }

  // Try required without id: Label!
  if (text.endsWith('!')) {
    return {
      label: text.slice(0, -1),
      required: true,
    };
  }

  return { label: text, required: false };
}
