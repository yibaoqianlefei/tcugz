import { readFile, writeFile } from 'node:fs/promises';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { chromium } from 'playwright';

const output = 'audit-output/textbook-overall-audit-2026-10-12';
const generator = await readFile('scripts/build-curriculum-preview.mjs', 'utf8');
const renderFunction = generator.slice(generator.indexOf('function renderMarkdown'), generator.indexOf('\nfunction shell'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const render = new Function('unified', 'remarkParse', 'remarkGfm', 'esc', 'markdown', `${renderFunction}\nreturn renderMarkdown(markdown);`);
const fixture = '# 识图测试\n\n## 墙脚示意\n\n![墙脚防潮与散水](/images/wall/apron-flashing-diagram.png)\n\n图后解释。';
const rendered = render(unified, remarkParse, remarkGfm, escape, fixture);
const imageProbe = { fixture, rendered, imageRendered: /<img\b/.test(rendered), alternateTextRendered: rendered.includes('墙脚防潮与散水') };
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width:1440,height:960 } });
try {
  await page.goto('http://127.0.0.1:5177/#/lesson/principles/thermal.html');
  await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.querySelector('.article'));
  const styles = await page.evaluate(() => {
    const doc = document.querySelector('.curriculum-frame').contentDocument;
    return ['.course-brand span','.page-head .eyebrow','.intro','.article p','.article-toc a','.chapter-nav a'].map(selector => {
      const element=doc.querySelector(selector); const style=doc.defaultView.getComputedStyle(element);
      return {selector,text:element.textContent.slice(0,40),color:style.color,fontSize:parseFloat(style.fontSize),fontWeight:style.fontWeight,background:doc.defaultView.getComputedStyle(selector.startsWith('.article p') ? element.closest('.article') : doc.body).backgroundColor};
    });
  });
  const channel = n => { const c=n/255; return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4; };
  const luminance = color => { const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(channel);return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2]; };
  for(const item of styles){ const a=luminance(item.color), b=luminance(item.background);item.contrastRatio=Number(((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)).toFixed(2)); }
  const beforeScroll = await page.evaluate(() => window.scrollY);
  const frame=page.frameLocator('.curriculum-frame');
  await frame.locator('.article-toc a').nth(2).click();
  await page.waitForFunction(() => window.scrollY>500);
  const afterScroll=await page.evaluate(() => window.scrollY);
  const bookmarkUrl=page.url();
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.curriculum-frame')?.contentDocument?.querySelector('.article'));
  const afterReload=await page.evaluate(() => window.scrollY);
  const tocProbe={beforeScroll,afterScroll,bookmarkUrl,afterReload};
  const {documents}=JSON.parse(await readFile('src/data/curriculumDocuments.json','utf8'));
  const literalMarkers=[];
  for(const path of documents){
    const html=await readFile(`public/lesson/${path}`,'utf8');
    if(html.includes('**参考答案')) literalMarkers.push(path);
  }
  await writeFile(`${output}/platform-probes.json`,JSON.stringify({imageProbe,contrastSamples:styles,tocProbe,literalAnswerMarkers:literalMarkers},null,2)+'\n');
  console.log(JSON.stringify({imageRendered:imageProbe.imageRendered,alternateTextRendered:imageProbe.alternateTextRendered,contrastSamples:styles,tocProbe,literalAnswerMarkers:literalMarkers},null,2));
}finally{await browser.close();}
