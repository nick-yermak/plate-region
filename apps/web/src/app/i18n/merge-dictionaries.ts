export type DictionarySourceFile = {
  /** Feature folder that contains `i18n/` (e.g. `layout`). */
  readonly name: string;
  readonly content: unknown;
};

export function flattenKeys(
  value: unknown,
  prefix = '',
  keys: string[] = [],
): string[] {
  if (value === null || typeof value !== 'object') {
    if (prefix) {
      keys.push(prefix);
    }
    return keys;
  }
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === 'object') {
      flattenKeys(nested, next, keys);
    } else {
      keys.push(next);
    }
  }
  return keys;
}

export function mergeDictionaryFiles(
  files: readonly DictionarySourceFile[],
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const file of files) {
    if (file.content === null || typeof file.content !== 'object') {
      throw new Error(
        `Dictionary for feature "${file.name}" must contain a JSON object`,
      );
    }
    const content = file.content as Record<string, unknown>;
    const topKeys = Object.keys(content);
    if (topKeys.length !== 1) {
      throw new Error(
        `Dictionary for feature "${file.name}" must have exactly one top-level key, found ${topKeys.length}: ${topKeys.join(', ') || '(none)'}`,
      );
    }
    const topKey = topKeys[0];
    if (topKey !== file.name) {
      throw new Error(
        `Dictionary for feature "${file.name}" top-level key must be "${file.name}", found "${topKey}"`,
      );
    }
    if (Object.prototype.hasOwnProperty.call(merged, topKey)) {
      throw new Error(`Duplicate top-level dictionary key "${topKey}"`);
    }
    merged[topKey] = content[topKey];
  }
  return merged;
}

export function assertMatchingKeySets(
  en: Record<string, unknown>,
  pl: Record<string, unknown>,
): void {
  const enKeys = flattenKeys(en).sort();
  const plKeys = flattenKeys(pl).sort();
  if (
    enKeys.length !== plKeys.length ||
    enKeys.some((k, i) => k !== plKeys[i])
  ) {
    const enOnly = enKeys.filter((k) => !plKeys.includes(k));
    const plOnly = plKeys.filter((k) => !enKeys.includes(k));
    throw new Error(
      `en and pl flattened key sets differ. Only in en: [${enOnly.join(', ')}]. Only in pl: [${plOnly.join(', ')}]`,
    );
  }
}
