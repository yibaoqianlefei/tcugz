import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const project = process.cwd();
const previewRoot = join(project, 'public', 'previews', 'curriculum');
const formalRoot = join(project, 'public', 'curriculum');
const siteBase = process.env.VITE_BASE_URL ?? '/';
if (!siteBase.startsWith('/') || !siteBase.endsWith('/')) throw new Error('VITE_BASE_URL must start and end with /');

function formalize(html) {
  return html
    .replaceAll('/previews/curriculum/', '/curriculum/')
    .replaceAll('/previews/wall-v1.html', '/curriculum/wall/index.html')
    .replaceAll('/previews/homepage-v1.html#introduction', '/#/?section=introduction')
    .replaceAll('/previews/homepage-v1.html#modules', '/#/?section=modules')
    .replaceAll('/previews/homepage-v1.html#principles', '/#/?section=principles')
    .replaceAll('/previews/homepage-v1.html#top', '/#/')
    .replaceAll('/previews/curriculum.css', '/curriculum/curriculum.css')
    .replaceAll('/previews/wall-v1.css', '/curriculum/wall.css')
    .replaceAll('UI 预览 · 墙体目录', '墙体章节')
    .replaceAll('二级目录预览', '章节目录')
    .replaceAll('墙体目录预览 · 仅用于版式确认', '墙体章节')
    .replaceAll('href="/curriculum/', `href="${siteBase}curriculum/`)
    .replaceAll('href="/#/', `href="${siteBase}#/`)
    .replaceAll('src="/brand/', `src="${siteBase}brand/`)
    .replaceAll('href="/favicon.svg"', `href="${siteBase}favicon.svg"`);
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (path.endsWith('.html')) output.push(path);
  }
  return output;
}

const sources = await walk(previewRoot);
for (const source of sources) {
  const destination = join(formalRoot, relative(previewRoot, source));
  await mkdir(join(destination, '..'), { recursive: true });
  await writeFile(destination, formalize(await readFile(source, 'utf8')), 'utf8');
}
await mkdir(join(formalRoot, 'wall'), { recursive: true });
// One wall-directory template feeds preview, formal page and lesson iframe.
// Keep the cover and stylesheet relative so a Pages subpath also works.
const wallTemplate = await readFile(join(project, 'scripts', 'templates', 'wall-directory.html'), 'utf8');
await writeFile(join(project, 'public', 'previews', 'wall-v1.html'), wallTemplate, 'utf8');
const wallSource = formalize(wallTemplate).replaceAll('../images/wall/', '../../images/wall/');
await writeFile(join(formalRoot, 'wall', 'index.html'), wallSource.replace('../lesson/wall-directory.css', '../../lesson/wall-directory.css'), 'utf8');
const lessonWall = join(project, 'public', 'lesson', 'wall');
await mkdir(lessonWall, { recursive:true });
await writeFile(join(lessonWall, 'index.html'), wallSource
  .replaceAll(`href="${siteBase}curriculum/`, `href="${siteBase}lesson/`)
  .replace('../lesson/wall-directory.css', '../wall-directory.css'), 'utf8');
await copyFile(join(project, 'public', 'previews', 'curriculum.css'), join(formalRoot, 'curriculum.css'));
await copyFile(join(project, 'public', 'previews', 'wall-v1.css'), join(formalRoot, 'wall.css'));
const documents = [...sources.map(source => relative(previewRoot, source).replaceAll('\\', '/')), 'wall/index.html'].sort();
const legacyRoutes = { '/textbook/introduction': '/?section=introduction' };
for (const path of documents) {
  const parts = path.split('/');
  if (parts[0] === 'basics') {
    const module = parts[1];
    const chapter = parts[2].replace('.html', '');
    legacyRoutes[`/textbook/${module}/${chapter}`] = `/lesson/${path}`;
    if (chapter === 'index') legacyRoutes[`/textbook/${module}`] = `/lesson/${module === 'wall' ? 'wall/index.html' : path}`;
    else legacyRoutes[`/textbook/${chapter}`] = `/lesson/${path}`;
  } else if (parts[0] === 'introduction') {
    const chapter = parts[1].replace('.html', '');
    legacyRoutes[`/textbook/introduction/${chapter}`] = `/lesson/${path}`;
    legacyRoutes[`/textbook/${chapter}`] = `/lesson/${path}`;
  }
}
legacyRoutes['/textbook/roof/index'] = '/lesson/basics/roof/roof-overview.html';
await writeFile(join(project, 'src', 'data', 'curriculumDocuments.json'), JSON.stringify({ documents, legacyRoutes }, null, 2) + '\n');
console.log('Formal curriculum pages generated.');
