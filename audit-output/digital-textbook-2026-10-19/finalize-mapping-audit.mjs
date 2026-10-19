import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { articles } from '../../scripts/lib/textbook-catalog.mjs';

// This freezes the manually reviewed mappings, not a build-time auto-approval.
// Changing a source, figure or model later requires a fresh matching review.
const root = 'audit-output/digital-textbook-2026-10-19';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const mediaBytes = await readFile('src/data/lessonMedia.json');
const media = JSON.parse(mediaBytes);
const captures = JSON.parse(await readFile(`${root}/model-pairs/results.json`, 'utf8'));
const notes = JSON.parse(await readFile(`${root}/visual-audit-notes.json`, 'utf8'));
assert(captures.complete && captures.errors.length === 0);
assert.equal(captures.nodes.length, 42);
assert.equal(captures.nodes.flatMap(node => node.snapshots).length, 46);
assert.equal(Object.keys(notes).length, 42);
const mappings = [];
for (const lesson of Object.values(media)) {
  const source = articles.find(article => article.path === lesson.path).source;
  const sourceSha256 = digest(await readFile(source));
  for (const figure of lesson.figures) {
    const capture = captures.nodes.find(node => node.nodeId === figure.nodeId);
    assert(capture && notes[figure.nodeId]);
    assert.equal(capture.image, figure.image);
    assert.equal(digest(await readFile(`public${figure.image}`)), capture.imageSha256, `drawing is the visually reviewed asset: ${figure.nodeId}`);
    for (const snapshot of capture.snapshots) {
      assert(snapshot.drawnPixels > 150);
      assert.equal(digest(await readFile(`public${snapshot.modelAsset}`)), snapshot.modelSha256, `model is the actually rendered asset: ${figure.nodeId}`);
    }
    mappings.push({
      key: lesson.key, path: lesson.path, source, sourceSha256,
      figureId: figure.id, nodeId: figure.nodeId, heading: figure.sectionTitle,
      relationship: figure.nodeId === 'construction-column-01' ? '同类构造比较，图与模型墙体布置不同，已在正文图注明确' : '图示构造与模型实体对应，按图注限定的学习范围使用',
      verdict: 'accepted', figureSha256: digest(JSON.stringify(figure)), image: figure.image, imageSha256: capture.imageSha256,
      visualEvidence: notes[figure.nodeId], modelEvidence: capture.snapshots,
    });
  }
}
assert.equal(mappings.length, 85);
const report = {
  date: '2026-10-19', status: 'reviewed-with-corrections', lessons: 54, illustratedLessons: 50, mappings: mappings.length, nodes: 42, renderedVariants: 46,
  auditMethod: '子agent分区读取原图、原文及节点配置并对照实际模型截图；主代理复核全部42节点46方案对照图及发现，补拍柱帽底视、隔离排水构件确认名称。逐图位绑定最终正文与资产散列。',
  mediaCatalogSha256: digest(mediaBytes), authoredPlanSha256: digest(await readFile('scripts/lib/lesson-media-catalog.mjs')),
  corrections: [
    '预制楼梯支承图移出现场浇筑小节；错步图移出防滑踏口小节。',
    '无梁楼板图移至无梁楼盖段，并通过底部视角确认柱帽。',
    '撤下坡瓦屋面专节借用的平屋面檐沟图，86处缩减为85处。',
    '挑梁三方案菜单按名称选择，图注明确(a)(b)(c)关系，避免字母顺序错配。',
    '过梁图未表达两端支座，图注与观察问题改为实际局部剖面范围。',
    '窗墙缝明确为木条、袋装矿棉及弹性胶的传统示例；不指认为发泡材料。',
    '构造柱原图与模型墙体布置不同，明确为同类联系比较；屋架未含覆盖层、檩条的范围已注明。',
    '修正有组织排水模型四个部件名称，取消旧卡无据尺寸和地面雨水口说法。',
    '修正木挂瓦条屋面知识卡层序、岩棉内侧涂料位置、楼盖传力终点及墙脚无据通用数值。'
  ],
  textOnlyLessons: Object.values(media).filter(lesson => !lesson.figures.length).map(lesson => ({ key: lesson.key, title: lesson.title, reason: '没有贴切的现有图模，不插入无关资产' })),
  entries: mappings,
};
await writeFile(`${root}/mapping-audit-final.json`, JSON.stringify(report, null, 2) + '\n');
const table = ['# 教材章节—插图—模型逐项对应表', '', '审计日期：2026-10-19。共85处对应、42个节点、46个实际渲染方案。每一行的正文版本、图注、原图和模型资产均在同目录 mapping-audit-final.json 中记录校验值。', '', '| 教材章节 | 正文小节 | 图位 | 关联节点 | 复核依据 |', '| --- | --- | --- | --- | --- |'];
for (const entry of mappings) table.push(`| ${entry.key} | ${entry.heading} | ${entry.figureId} | ${entry.nodeId} | ${entry.visualEvidence} |`);
await writeFile(`${root}/教材图模对应表.md`, table.join('\n') + '\n');
console.log(`Frozen mapping audit: ${mappings.length} placements, 42 drawings/nodes, 46 real model variants.`);
