const revision = '20261011-6';
const artCache = new Map();

function readArt(key) {
  if (!artCache.has(key)) {
    const promise = fetch('./art/' + key + '.svg?v=' + revision)
      .then(response => {
        if (!response.ok) throw new Error('图形加载失败：' + key);
        return response.text();
      })
      .then(markup => {
        const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
        if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') {
          throw new Error('图形格式错误：' + key);
        }
        return doc.documentElement;
      });
    artCache.set(key, promise);
  }
  return artCache.get(key);
}

// Local SVGs inherit the chapter's fixed blue and vermilion colors.
export async function mountArt(target, key) {
  if (!target) return;
  target.dataset.renderingConcept = key;
  try {
    const svg = await readArt(key);
    if (target.dataset.renderingConcept !== key) return;
    const copy = document.importNode(svg, true);
    copy.setAttribute('aria-hidden', 'true');
    copy.setAttribute('focusable', 'false');
    target.classList.remove('art-error');
    target.replaceChildren(copy);
  } catch (error) {
    if (target.dataset.renderingConcept !== key) return;
    target.textContent = '图形暂未加载';
    target.classList.add('art-error');
    console.error(error);
  }
}


