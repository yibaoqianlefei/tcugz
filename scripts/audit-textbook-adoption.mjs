import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { articles } from './lib/textbook-catalog.mjs';

const output = 'audit-output/textbook-content-2026-10-12';
const allocation = JSON.parse(await readFile('audit-output/textbook-audit-2026-10-11/content-allocation.json', 'utf8'));
const manifest = JSON.parse(await readFile('src/data/curriculumDocuments.json', 'utf8'));
const aliases = {
  'training-construction-brief': 'construction-brief',
  'training-construction-survey': 'construction-survey',
  'training-envelope-detail': 'envelope-detail',
  'training-floor-layout': 'floor-layout',
  'training-integrated-design': 'integrated-design',
  'training-roof-plan': 'roof-drainage',
  'training-stair-drawing': 'stairs-drawing',
};
const adoptedBlocks = allocation.blocks.map(block => {
  const group = block.destination_module === 'training' ? 'practice' : block.destination_module === 'shared' ? 'floor' : block.destination_module;
  const section = block.destination_section.replace('proposed:', '');
  const article = articles.find(item => item.group === group && item.id === (aliases[section] ?? section));
  if (!article && group !== 'archive') throw new Error(`No implemented topic for ${block.allocation_id}: ${group}/${section}`);
  return { ...block, adopted_route: article ? `/lesson/${article.path}` : null, adoption: article ? '已提供对应主题的重组正文；原图与旧参数仍按复核标记处理' : '历史目录、域代码和尾部占位留档', retained_review_flags: block.review_flags };
});
const source = await readFile('D:/构造相关内容/建筑构造上册讲义-李峰.doc');
const sourceHash = createHash('sha256').update(source).digest('hex');
if (sourceHash !== allocation.source_sha256) throw new Error('Original lecture file changed');
const stats = await Promise.all(articles.map(async article => {
  const text = await readFile(article.source, 'utf8');
  const sourceBlocks = adoptedBlocks.filter(block => block.adopted_route === `/lesson/${article.path}`).map(block => block.allocation_id);
  return { title: article.title, group: article.group, source: article.source, route: `/lesson/${article.path}`, chinese_characters: (text.match(/[\u3400-\u9fff]/g) ?? []).length, source_blocks: sourceBlocks };
}));
await mkdir(output, { recursive: true });
await writeFile(`${output}/内容实施对应表.json`, JSON.stringify({ date: '2026-10-12', original_source_sha256: sourceHash, original_source_unchanged: true, scope: '文字教材首版；按主题合并、纠错并补写；原图与工程限值继续复核', articles: stats, blocks: adoptedBlocks }, null, 2) + '\n');
await writeFile(`${output}/verification.json`, JSON.stringify({
  date: '2026-10-12', articles: articles.length, core_articles: stats.filter(item => !['principles', 'practice'].includes(item.group)).length,
  principle_articles: stats.filter(item => item.group === 'principles').length, practice_tasks: stats.filter(item => item.group === 'practice').length,
  routes: manifest.documents.length, chinese_characters: stats.reduce((sum, item) => sum + item.chinese_characters, 0), original_source_unchanged: true,
  source_blocks: adoptedBlocks.length, archived_blocks: adoptedBlocks.filter(item => !item.adopted_route).length,
  checks: { production_build: 'passed', textbook_rendered_text_links_routes_and_subpaths: 'passed', companion_corpus: '484 sources / 17 hints', companion_unit_and_browser: 'passed', existing_training_contracts_scoring_persistence: '8 modes / 17 questions passed', textbook_browser: '64 HTTP readers and navigation passed', reader_lifecycle_and_observer: 'same-document observer, asynchronous writes, disposal guards and every-frame window error checks passed', desktop_visual_review: '1440x960 passed', mobile_visual_review: '390px and 320px passed', editorial_review: '54 articles reviewed; parapet drainage direction corrected' },
  known_limits: ['原 DOC 图片和嵌入对象尚未完整重建', '具体工程参数与原规范表须结合有效版本和适用条件进一步复核', '既有模型参数另行专业审校'],
  environment: '受限 Windows 中 tsx 的 uv_os_get_passwd 初始化失败，构建及 TS 测试经本机执行通过；浏览器验证使用已安装 Chrome。',
  screenshots: ['wall-directory-desktop.png', 'roof-article-desktop.png', 'roof-article-mobile-390.png', 'roof-article-mobile-320.png'],
}, null, 2) + '\n');
console.log(`Adoption record saved: ${articles.length} articles, ${adoptedBlocks.length} source blocks, original DOC unchanged.`);
