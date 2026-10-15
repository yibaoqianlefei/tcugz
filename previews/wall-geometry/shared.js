const variants = [
  { id: 'modules', letter: 'A', name: '构造模块' },
  { id: 'slices', letter: 'B', name: '建筑切片' },
  { id: 'lines', letter: 'C', name: '线与接缝' },
];
const chapters = [
  ['index.html', '墙体概述', '建立对墙体功能与基本构造的整体认识', true],
  ['wall-role.html', '墙体在建筑中的作用', '理解承重、围护与空间分隔三大功能', false],
  ['wall-types.html', '墙体的类型', '按受力、位置与材料认识不同墙体', false],
  ['wall-masonry.html', '砌体结构', '认识砖砌体、砌块墙与构造柱圈梁', false],
  ['wall-partition.html', '隔墙', '了解非承重隔墙的类型与构造做法', true],
  ['wall-design-requirements.html', '墙体的设计要求', '串联结构、保温、防水、隔声与防火要求', true],
];
function fill(slot, markup) {
  const element = document.querySelector(`[data-shared-${slot}]`);
  if (element) element.innerHTML = markup;
}
const active = document.body.dataset.variant;
fill('header', `<a class="preview-brand" href="../../#/" aria-label="返回学习首页"><img src="../../brand/logo.svg" width="42" height="42" alt="建筑构造标志"><span>建筑构造 <small>/ 构造基础 / 墙体</small></span></a><a class="preview-return" href="../../#/lesson/wall/index.html">← 原版对照</a>`);
fill('variants', `<span class="preview-label">设计预览</span><div class="variant-links">${variants.map(v => `<a class="preview-variant-link${active === v.id ? ' is-current' : ''}" href="./${v.id}.html"${active === v.id ? ' aria-current="page"' : ''}><span>${v.letter}</span> ${v.name}</a>`).join('')}</div><a class="compare-link" href="./index.html">对比入口 ↗</a>`);
fill('intro', `<span class="intro-eyebrow">构造基础 / 墙体篇</span><div class="intro-heading"><h1 id="wall-heading">墙体</h1><span class="intro-english">WALL SYSTEMS</span></div><p class="intro-lead">构筑空间，也连接结构。</p><p class="intro-description">从一块砖到一道墙，认识墙体的作用、类型与连接方式，理解建筑如何承重、围护与分隔。</p><ul class="intro-themes" aria-label="墙体的三种作用"><li>承重</li><li>围护</li><li>分隔</li></ul>`);
fill('section', `<div><span class="section-eyebrow">READ & EXPLORE / 06</span><h2 id="chapters-heading">墙体章节</h2></div><p>从整体认识，走向构造细节</p>`);
fill('chapters', chapters.map(([file, name, summary, readable], i) => `<a class="chapter-entry" data-chapter="${i + 1}" href="../../#/lesson/basics/wall/${file}"><span class="chapter-number">${String(i + 1).padStart(2, '0')}</span><div class="chapter-body"><div class="chapter-meta"><span class="chapter-status${readable ? ' is-readable' : ''}">${readable ? '可阅读' : '暂无内容'}</span></div><h3>${name}</h3><p>${summary}</p></div><span class="chapter-arrow" aria-hidden="true">↗</span></a>`).join(''));
fill('note', '<p>已开放：墙体概述、隔墙、墙体的设计要求。<span>其余章节可进入查看内容状态。</span></p>');
if (new URLSearchParams(location.search).get('embedded') === '1') {
  document.body.classList.add('is-embedded');
  document.querySelectorAll('a').forEach(link => { link.target = '_top'; });
}
