const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const geometries = {
  orbit: `
    <path d="M280 84 505 133 524 310 357 395 248 243Z" fill="#43558e" />
    <path d="M95 298 212 90 342 319Z" fill="#e34b36" />
    <ellipse cx="302" cy="245" rx="244" ry="163" transform="rotate(-19 302 245)" fill="none" stroke="#222222" stroke-width="2.4" stroke-dasharray="10 13" />`,
  offset: `
    <path d="M90 229 285 176 324 353 122 394Z" fill="#e34b36" />
    <path d="M340 76 544 228 392 391 278 222Z" fill="#43558e" />
    <path d="M156 83L405 55Q421 53 426 69L516 333Q522 349 506 356L214 409Q198 414 193 398L140 105Q137 86 156 83Z" fill="none" stroke="#20293b" stroke-width="2.4" />`,
  arc: `
    <path d="M246 62 523 125 444 385 167 322Z" fill="#43558e" />
    <polygon points="85,373 85,85 373,373" transform="rotate(12 181 277)" fill="#e34b36" />
    <ellipse cx="313" cy="235" rx="280" ry="95" transform="rotate(-22 313 235)" fill="none" stroke="#222222" stroke-width="2.4" />`,
  balance: `
    <ellipse cx="254" cy="223" rx="151" ry="165" transform="rotate(15 254 223)" fill="#e34b36" />
    <path d="M304 240 526 273 462 387 260 346Z" fill="#43558e" />
    <path d="M161 405L526 345Q546 342 536 325L370 66Q360 49 349 66L145 383Q129 410 161 405Z" fill="none" stroke="#302621" stroke-width="2.4" />`,
  sweep: `
    <circle cx="258" cy="224" r="151" fill="#43558e" />
    <rect x="293" y="167" width="216" height="216" transform="rotate(16 401 275)" fill="#e34b36" />
    <rect x="132" y="82" width="346" height="312" rx="22" transform="rotate(-16 305 238)" fill="none" stroke="#222222" stroke-width="2.4" />`,
  crossing: `
    <path d="M196 103 415 64 498 338 279 379Z" fill="#43558e" />
    <path d="M76 302 104 224 545 259 514 346Z" fill="#e34b36" />
    <path d="M73 408L332 52L559 232L370 414Z" fill="none" stroke="#222222" stroke-width="2.4" stroke-dasharray="7 9" />`,
};

const defaultCompositions = { foundation: 'orbit', 'door-window': 'offset', floor: 'arc', stairs: 'balance', roof: 'sweep', 'deformation-joint': 'crossing' };

function renderGeometry(composition) {
  return `<svg class="wall-geometry module-geometry" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 460" aria-hidden="true" focusable="false">${geometries[composition] ?? geometries.orbit}</svg>`;
}

export function renderModuleDirectory({ id, module, design }) {
  if (!id || !module?.topics?.length || !design) throw new Error('Chapter directories need an id, topics, and a design.');
  const title = escapeHtml(module.title);
  const count = module.topics.length;
  const themes = (design.themes ?? []).map(theme => `<li>${escapeHtml(theme)}</li>`).join('');
  const stage = `<div class="wall-art-stage module-art-stage">${renderGeometry(design.geometry ?? defaultCompositions[id])}</div>`;
  const cards = module.topics.map((topic, index) => `<a class="chapter-card" href="/previews/curriculum/basics/${escapeHtml(id)}/${escapeHtml(topic.id)}.html">
              <div class="chapter-card-top"><span class="chapter-number">${String(index + 1).padStart(2, '0')}</span></div>
              <div class="chapter-copy"><h3>${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.description)}</p></div>
            </a>`).join('\n            ');
  const note = design.sectionNote ?? `${count} 节正文，沿构造原理逐步理解连接与做法。`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} · 建筑构造</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/lesson/module-directory.css?v=20261013-closed" />
</head>
<body>
  <div class="wall-page module-directory module-directory--${escapeHtml(id)}">
    <main class="main" id="top">
      <header class="topbar">
        <a class="wall-brand" href="/previews/homepage-v1.html#top"><img src="/brand/logo.svg" width="40" height="40" alt="" aria-hidden="true" /><span class="crumb">建筑构造 / 构造基础 / ${title}</span></a>
        <a class="wall-back" href="/previews/homepage-v1.html#modules"><span class="wall-back-icon" aria-hidden="true">←</span><span>返回构造基础</span></a>
      </header>
      <div class="content">
        <section class="wall-intro" aria-labelledby="module-heading">
          <div class="wall-intro-copy">
            <div class="eyebrow">构造基础 <span aria-hidden="true">/</span> ${title}篇</div>
            <div class="wall-heading-line"><h1 id="module-heading">${title}</h1><span class="wall-title-en" lang="en">${escapeHtml(design.english)}</span></div>
            <p class="wall-lead">${escapeHtml(design.lead)}</p>
            <p class="wall-intro-desc">${escapeHtml(design.description ?? module.description)}</p>
            <ul class="wall-themes" aria-label="${title}学习关键词">${themes}</ul>
            <a class="module-browse" href="#chapters"><span>浏览章节</span><span aria-hidden="true">↓</span></a>
          </div>
          <figure class="wall-visual wall-visual--geometry module-visual" aria-hidden="true">
            ${stage}
          </figure>
        </section>
        <section class="wall-section" id="chapters" aria-labelledby="chapters-heading">
          <div class="section-top"><div><span class="mini-label">READ &amp; EXPLORE / ${String(count).padStart(2, '0')}</span><h2 id="chapters-heading">${title}章节</h2></div><p>从整体认识，走向构造细节</p></div>
          <div class="chapter-grid${count === 2 ? ' chapter-grid--pair' : ''}">
            ${cards}
          </div>
          <div class="section-note"><span>${escapeHtml(note)}</span><span>由构造概念，走向细部做法</span></div>
        </section>
      </div>
    </main>
  </div>
</body>
</html>
`;
}
