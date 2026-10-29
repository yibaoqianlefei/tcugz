import { articles } from './textbook-catalog.mjs';

// One selector is shared by media, HTML, promotion and companion generation.
export function chapterSelection(args = process.argv.slice(2)) {
  const option = args.find(value => value.startsWith('--chapters='));
  const offset = args.indexOf('--chapters');
  const value = option?.slice('--chapters='.length) ?? (offset >= 0 ? args[offset + 1] : undefined);
  const names = args.includes('--wall-only') ? ['wall'] : value?.split(',').filter(Boolean);
  const known = new Set(articles.map(article => article.group));
  for (const name of names ?? []) if (!known.has(name)) throw new Error(`Unknown chapter: ${name}`);
  if (offset >= 0 && !value) throw new Error('--chapters needs comma-separated chapter names');
  const selected = new Set(names ?? known);
  return { scoped: Boolean(names), selected, includes: key => selected.has(key.split('/')[0]),
    paths: new Set(articles.filter(article => selected.has(article.group)).map(article => article.path)) };
}
