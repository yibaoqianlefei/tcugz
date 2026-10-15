import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { nodeDefinitions } from '../../src/data/nodeDefinitions.ts';
import { trainingModes } from '../../src/data/training.ts';

const root = new URL('../../', import.meta.url);
const output = new URL('./', import.meta.url);
const curriculum = JSON.parse(await readFile(new URL('src/data/curriculumDocuments.json', root), 'utf8'));
const plain = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const documents = await Promise.all(curriculum.documents.map(async (path: string) => {
  const html = await readFile(new URL(`public/lesson/${path}`, root), 'utf8');
  const article = html.match(/<article\b[^>]*class="article"[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? '';
  return {
    path, route: `/lesson/${path}`,
    title: plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? ''),
    type: html.includes('course-page--cover') ? 'cover' : html.includes('course-page--article') ? 'article' : 'directory',
    stylesheets: [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1]),
    images: [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map(match => match[1]),
    h1Count: [...html.matchAll(/<h1\b/g)].length,
    h2Count: [...html.matchAll(/<h2\b/g)].length,
    teachingVisuals: [...article.matchAll(/<(?:img|svg|video|canvas)\b/g)].length,
    tables: [...article.matchAll(/<table\b/g)].length,
    nodeLinks: [...article.matchAll(/href="[^\"]*#\/node\//g)].length,
    localLinks: [...html.matchAll(/<a\b[^>]*href="(\/lesson\/[^"#]+)(?:#[^"]*)?"/g)].map(match => match[1]),
  };
}));
const documentPaths = new Set(documents.map(document => `/lesson/${document.path}`));
const inventory = {
  date: '2026-10-15', commit: 'f5689e3', origin: 'http://127.0.0.1:5174', developmentOrigin: 'http://127.0.0.1:5173',
  documents,
  nodes: nodeDefinitions.map(node => ({ id: node.id, title: node.title, category: node.category, status: node.status, model: Boolean(node.model || node.models), diagram: Boolean(node.diagram) })),
  trainingModes: trainingModes.map(mode => ({ id: mode.id, title: mode.title, route: `/games/${mode.id}` })),
  missingCourseLinks: documents.flatMap(document => document.localLinks.filter(link => !documentPaths.has(link)).map(link => ({ from: document.path, to: link }))),
  notes: ['Inventory covers registered source data; visual and interaction coverage is recorded separately in measurements.json.', 'Visual audit uses a fresh local production build on port 5174 to avoid stale development-module caches. No site files changed after the audited commit.'],
};
await mkdir(new URL('evidence/', output), { recursive: true });
await writeFile(new URL('inventory.json', output), JSON.stringify(inventory, null, 2));
console.log(JSON.stringify({ documents: documents.length, types: documents.reduce((counts, document) => ({ ...counts, [document.type]: (counts[document.type] ?? 0) + 1 }), {} as Record<string, number>), nodes: inventory.nodes.length, libraryNodes: inventory.nodes.filter(node => node.category !== '案例').length, modes: inventory.trainingModes.length, missingCourseLinks: inventory.missingCourseLinks.length }));
