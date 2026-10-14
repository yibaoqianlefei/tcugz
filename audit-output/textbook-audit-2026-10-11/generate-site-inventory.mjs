import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Audit only: reads site sources, writes this audit's inventory, never rebuilds pages.
const root = process.cwd();
const modules = [
  ['introduction', 'introSections'],
  ['wall', 'wallSections'],
  ['door-window', 'windowSections'],
  ['foundation', 'foundationSections'],
  ['floor', 'floorSections'],
  ['stairs', 'stairsSections'],
  ['roof', 'roofSections'],
  ['deformation-joint', 'deformationJointSections'],
];
const result = [];
async function add(module, id, title, bodySource = null) {
  const relative = module === 'introduction'
    ? `introduction/${id}.html`
    : module === 'principles'
      ? `principles/${id}.html`
      : `basics/${module}/${id}.html`;
  const publicPath = `public/lesson/${relative}`;
  const absolute = resolve(root, publicPath).replaceAll('\\', '/');
  const html = await readFile(absolute, 'utf8');
  result.push({
    module,
    section_id: id,
    title,
    public_path: publicPath,
    has_body: /<article class="article">/.test(html),
    source: absolute,
    body_source: bodySource,
  });
}
const bodySources = {
  'wall/wall-partition': 'src/data/textbook/walls/partitions.md',
  'wall/wall-design-requirements': 'src/data/textbook/walls/wall-design-requirements.md',
  'roof/roof-overview': 'src/data/textbook/roof/index.md',
};
for (const [module, source] of modules) {
  const sections = (await import(pathToFileURL(resolve(root, `src/data/sections/${source}.js`)).href)).default;
  for (const section of sections) await add(module, section.id, section.title, bodySources[`${module}/${section.id}`] ?? null);
}
await add('wall', 'index', '墙体概述', 'src/data/textbook/walls/index.md');
for (const [id, title] of [
  ['thermal', '建筑保温'],
  ['waterproof', '建筑防水'],
  ['insulation', '建筑隔热'],
  ['acoustic', '建筑隔声'],
  ['fire', '建筑防火'],
  ['moisture', '建筑防潮'],
]) await add('principles', id, title);
await writeFile(resolve(root, 'audit-output/textbook-audit-2026-10-11/site-inventory.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ total: result.length, configuredSections: 35, extraWallOverview: 1, principles: 6, hasBody: result.filter(row => row.has_body).length, empty: result.filter(row => !row.has_body).length }));
