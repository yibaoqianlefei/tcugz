import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const output = 'audit-output/digital-textbook-2026-10-19';
await mkdir(`${output}/model-pairs`, { recursive: true });
const media = JSON.parse(await readFile('src/data/lessonMedia.json', 'utf8'));
const unique = new Map();
for (const lesson of Object.values(media)) for (const figure of lesson.figures) {
  if (!unique.has(figure.nodeId)) unique.set(figure.nodeId, { lesson, figure, uses: [] });
  unique.get(figure.nodeId).uses.push({ key: lesson.key, figure: figure.id, heading: figure.sectionTitle });
}
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const modelRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (/\.glb(?:\?|$)/.test(request.url())) modelRequests.push(new URL(request.url()).pathname); });
const results = [];
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
try {
  for (const [nodeId, { lesson, figure, uses }] of unique) {
    await page.goto(`http://127.0.0.1:5187/#/lesson/${lesson.path}`);
    const frame = page.frameLocator('.curriculum-frame');
    await frame.locator(`.lesson-figure-image[data-lesson-figure="${figure.id}"]`).click();
    await page.getByRole('tab', { name: '三维模型' }).click();
    await page.locator('.lesson-model-stage[data-rendered="true"]').waitFor({ timeout: 30000 });
    const select = page.locator('.lesson-model-variants select');
    const variants = await select.count() ? await select.locator('option').evaluateAll(options => options.map(option => ({ value: option.value, label: option.textContent }))) : [{ value: 'single', label: figure.nodeTitle }];
    const snapshots = [];
    for (const variant of variants) {
      if (variant.value !== 'single') await select.selectOption(variant.value);
      await page.locator('.lesson-model-stage[data-rendered="true"]').waitFor({ timeout: 30000 });
      const canvas = page.locator('.lesson-model-stage canvas');
      const buffer = await canvas.screenshot();
      const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      let drawn = 0;
      for (let i = 0; i < data.length; i += info.channels) if (Math.abs(data[i] - 238) + Math.abs(data[i + 1] - 241) + Math.abs(data[i + 2] - 248) > 45) drawn++;
      assert(drawn > 150, `actual nonempty geometry: ${nodeId} ${variant.value}`);
      const stem = `${nodeId}--${variant.value}`;
      await writeFile(`${output}/model-pairs/${stem}-model.png`, buffer);
      const left = await sharp(`public/${figure.image.replace(/^\/+/, '')}`).resize(610, 430, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
      const right = await sharp(buffer).resize(610, 430, { fit: 'contain', background: '#eef1f8' }).png().toBuffer();
      const label = Buffer.from(`<svg width="1280" height="650" xmlns="http://www.w3.org/2000/svg"><rect width="1280" height="650" fill="#f8f8f5"/><g font-family="Microsoft YaHei,sans-serif" fill="#1c2544"><text x="24" y="32" font-size="18">${esc(nodeId)} / ${esc(variant.label)}</text><text x="24" y="65" font-size="14">节点原图</text><text x="664" y="65" font-size="14">网页实际模型：${esc(variant.label)}</text><text x="24" y="545" font-size="14">${esc(figure.image)}</text><text x="24" y="578" font-size="13">首个教材入口：${esc(lesson.key)} → ${esc(figure.sectionTitle)}</text><text x="24" y="611" font-size="12">非背景像素：${drawn}；关联教材图位：${uses.length}</text></g></svg>`);
      await sharp(label).composite([{ input: left, left: 20, top: 86 }, { input: right, left: 650, top: 86 }]).png().toFile(`${output}/model-pairs/${stem}-pair.png`);
      const modelAsset = modelRequests.at(-1);
      assert(modelAsset?.endsWith('.glb'));
      const modelSha256 = createHash('sha256').update(await readFile(`public${modelAsset}`)).digest('hex');
      snapshots.push({ variant: variant.value, label: variant.label, modelAsset, modelSha256, drawnPixels: drawn, pair: `${output}/model-pairs/${stem}-pair.png`, model: `${output}/model-pairs/${stem}-model.png` });
    }
    results.push({ nodeId, nodeTitle: figure.nodeTitle, image: figure.image, imageSha256: createHash('sha256').update(await readFile(`public${figure.image}`)).digest('hex'), partNames: await page.locator('.lesson-model-part').allTextContents(), uses, snapshots });
    await page.getByRole('button', { name: '关闭图模研读，返回正文' }).click();
    console.log(`${results.length}/${unique.size} ${nodeId}: ${snapshots.length} actual view(s)`);
  }
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: `${output}/model-pairs/failure.png` });
  console.error(await page.locator('dialog').innerText().catch(() => 'no dialog'));
  throw error;
} finally {
  await writeFile(`${output}/model-pairs/results.json`, JSON.stringify({ complete: results.length === unique.size, nodes: results, errors }, null, 2));
  await browser.close();
}
