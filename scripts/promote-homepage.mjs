import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { formalizeCourse } from './lib/course-paths.mjs';

const project = process.cwd();
const previewRoot = join(project, 'public', 'previews', 'curriculum');
const formalRoot = join(project, 'public', 'curriculum');
const lessonRoot = join(project, 'public', 'lesson');
const siteBase = process.env.VITE_BASE_URL ?? '/';
if (!siteBase.startsWith('/') || !siteBase.endsWith('/')) throw new Error('VITE_BASE_URL must start and end with /');

function formalize(html) {
  return formalizeCourse(html, siteBase);
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
  const html = formalize(await readFile(source, 'utf8'));
  for (const targetRoot of [formalRoot, lessonRoot]) {
    const destination = join(targetRoot, relative(previewRoot, source));
    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, html, 'utf8');
  }
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
  .replace('../lesson/wall-directory.css', '../wall-directory.css'), 'utf8');
await copyFile(join(project, 'public', 'previews', 'curriculum.css'), join(formalRoot, 'curriculum.css'));
await copyFile(join(project, 'public', 'previews', 'curriculum.css'), join(lessonRoot, 'curriculum.css'));
await copyFile(join(project, 'public', 'previews', 'wall-v1.css'), join(formalRoot, 'wall.css'));
await copyFile(join(project, 'public', 'previews', 'wall-v1.css'), join(lessonRoot, 'wall.css'));
// Former home-section indexes only redirect; they are no longer course documents.
const documents = [...sources.map(source => relative(previewRoot, source).replaceAll('\\', '/')).filter(path => !['introduction/index.html', 'principles/index.html'].includes(path)), 'wall/index.html'].sort();
const legacyRoutes = {
  '/textbook/introduction': '/?section=introduction',
  '/textbook/introduction/index': '/?section=introduction',
  '/textbook/index': '/?section=introduction',
  '/textbook/principles': '/?section=principles',
  '/textbook/principles/index': '/?section=principles',
};
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
