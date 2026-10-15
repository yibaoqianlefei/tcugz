// Browser operations use the documented CUA Tab API supplied by the caller.
// Import this module inside cua_repl; it does not launch another browser.
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('./', import.meta.url);

function measureDocument(body) {
  const d = body.ownerDocument;
  const css = e => e.ownerDocument.defaultView.getComputedStyle(e);
  const visible = e => e.getBoundingClientRect().width > 0 && css(e).visibility !== 'hidden' && !e.closest('[inert],[aria-hidden="true"]');
  const all = selector => [...d.querySelectorAll(selector)].filter(visible);
  const pick = selector => all(selector)[0];
  const read = e => e ? {
    text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
    class: e.className?.baseVal ?? e.className,
    rect: e.getBoundingClientRect().toJSON(),
    font: css(e).fontSize, lineHeight: css(e).lineHeight, color: css(e).color,
    background: css(e).backgroundColor, radius: css(e).borderRadius,
  } : null;
  const article = pick('.article');
  const controls = all('button,a,select,summary,input,textarea');
  return {
    title: d.title, embedded: d.documentElement.dataset.embedded ?? null,
    h1: all('h1').map(read), h2: all('h2').slice(0, 6).map(read),
    body: { color: css(body).color, background: css(body).backgroundColor, font: css(body).fontFamily, scrollWidth: d.documentElement.scrollWidth, clientWidth: d.documentElement.clientWidth, height: body.getBoundingClientRect().height },
    innerOverflow: d.documentElement.scrollWidth > d.documentElement.clientWidth + 1,
    article: read(article), intro: read(pick('.intro,.site-page-intro,.wall-intro-desc')),
    card: read(pick('.directory-card,.site-resource-card,.training-mode-card,.case-project-card')),
    header: read(pick('.site-subpage-topbar,.topbar')), chapterNavigation: read(pick('.chapter-nav')),
    content: read(pick('main.content,.content,.site-page-main,main.site-container')),
    images: all('img').map(e => ({ src: e.getAttribute('src'), complete: e.complete, naturalWidth: e.naturalWidth, width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, alt: e.alt })),
    smallControls: controls.filter(e => e.getBoundingClientRect().height < 36 && !e.closest('.article')).slice(0, 24).map(read),
    anonymousButtons: controls.filter(e => e.tagName === 'BUTTON' && !e.textContent.trim() && !e.getAttribute('aria-label') && !e.title).map(read),
    controlsCount: controls.length, paragraph: read(article?.querySelector('p')), bodyClasses: body.className,
  };
}

export async function createAuditSession(tab) {
  const load = async (file, fallback) => { try { return JSON.parse(await readFile(new URL(file, root), 'utf8')); } catch { return fallback; } };
  const state = {
    records: await load('measurements.json', []), shots: await load('screenshots.json', []),
    details: await load('detail-checks.json', []), base: 'http://127.0.0.1:5174/#',
  };
  async function save() {
    for (const [file, value] of [['measurements.json', state.records], ['screenshots.json', state.shots], ['detail-checks.json', state.details]]) {
      await writeFile(new URL(file, root), JSON.stringify(value, null, 2));
    }
  }
  async function record(id, label, screenshot = true) {
    const outer = await tab.playwright.evaluate(() => ({ url: location.href, viewport: { width: innerWidth, height: innerHeight }, outerOverflow: document.documentElement.scrollWidth > innerWidth + 1, frame: !!document.querySelector('.curriculum-frame'), scrollY }));
    const measured = outer.frame
      ? await tab.playwright.frameLocator('.curriculum-frame').locator('body').evaluate(measureDocument)
      : await tab.playwright.locator('body').evaluate(measureDocument);
    // Frame inspection may center a tall iframe. Restore the top for evidence.
    if (outer.frame && screenshot) {
      await tab.scroll([outer.viewport.width / 2, outer.viewport.height / 2], 'up', 20);
      outer.scrollY = await tab.playwright.evaluate(() => scrollY);
    }
    const measurement = { ...measured, ...outer, id, label };
    state.records = state.records.filter(row => row.id !== id || row.viewport.width !== outer.viewport.width);
    state.records.push(measurement);
    if (screenshot) {
      const file = `evidence/${id}-${outer.viewport.width}.jpg`;
      await writeFile(new URL(file, root), await tab.screenshot({ fullPage: false }));
      state.shots = state.shots.filter(row => row.id !== id || row.width !== outer.viewport.width);
      state.shots.push({ id, label, width: outer.viewport.width, height: outer.viewport.height, file, url: outer.url });
    }
    await save();
    return { id, width: outer.viewport.width, overflow: measured.innerOverflow || outer.outerOverflow, h1: measured.h1[0]?.text, title: measured.title };
  }
  async function scene(id, label, route, ready = 'h1.site-page-title') {
    await tab.goto(state.base + route);
    await tab.playwright.locator(ready).first().waitFor({ state: 'visible', timeoutMs: 10000 });
    return record(id, label);
  }
  return { state, record, scene, save };
}
