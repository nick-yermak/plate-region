/**
 * Merge feature-colocated translation sources into one dictionary per language.
 *
 * Sources: apps/web/src/app/<feature>/i18n/{en,pl}.json
 * Output:  apps/web/generated/i18n/{en,pl}.json (gitignored)
 *
 * Usage: node --experimental-strip-types apps/web/scripts/merge-i18n.mts
 */

import { fileURLToPath } from 'node:url';
import { basename, dirname, join, relative, resolve } from 'node:path';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  assertMatchingKeySets,
  mergeDictionaryFiles,
  type DictionarySourceFile,
} from '../src/app/i18n/merge-dictionaries.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(SCRIPT_DIR, '..');
const APP_ROOT = resolve(WEB_ROOT, 'src/app');
const OUT_DIR = resolve(WEB_ROOT, 'generated/i18n');
const LANGS = ['en', 'pl'] as const;

function collectSources(lang: (typeof LANGS)[number]): DictionarySourceFile[] {
  const files: DictionarySourceFile[] = [];
  const fileName = `${lang}.json`;

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (!entry.isDirectory()) {
        continue;
      }
      if (entry.name === 'i18n') {
        // Skip infrastructure `app/i18n/` (TypeScript only, no dictionaries).
        const hasDictionaryJson = readdirSync(path).some((name) =>
          name.endsWith('.json'),
        );
        if (!hasDictionaryJson) {
          continue;
        }
        const langPath = join(path, fileName);
        if (!existsSync(langPath)) {
          throw new Error(
            `Missing translation source ${relative(WEB_ROOT, langPath)}`,
          );
        }
        const content = JSON.parse(readFileSync(langPath, 'utf8')) as unknown;
        files.push({ name: basename(dir), content });
        continue;
      }
      walk(path);
    }
  }

  walk(APP_ROOT);
  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const byLang: Record<(typeof LANGS)[number], Record<string, unknown>> = {
    en: {},
    pl: {},
  };

  for (const lang of LANGS) {
    const sources = collectSources(lang);
    if (sources.length === 0) {
      throw new Error(
        `No translation sources found under ${relative(WEB_ROOT, APP_ROOT)} for language "${lang}"`,
      );
    }
    byLang[lang] = mergeDictionaryFiles(sources);
  }

  assertMatchingKeySets(byLang.en, byLang.pl);

  for (const lang of LANGS) {
    const outPath = join(OUT_DIR, `${lang}.json`);
    writeFileSync(
      outPath,
      `${JSON.stringify(byLang[lang], null, 2)}\n`,
      'utf8',
    );
  }
}

main();
