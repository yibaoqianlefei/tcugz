/** Canonical lesson URLs must work at a domain root and a hosted subdirectory. */
export function formalizeCourse(html, siteBase = '/') {
  if (!siteBase.startsWith('/') || !siteBase.endsWith('/')) throw new Error('VITE_BASE_URL must start and end with /');
  return html
    .replaceAll('/previews/curriculum/', '/lesson/')
    .replaceAll('/previews/wall-v1.html', '/lesson/wall/index.html')
    .replaceAll('/previews/homepage-v1.html#introduction', '/#/?section=introduction')
    .replaceAll('/previews/homepage-v1.html#modules', '/#/?section=modules')
    .replaceAll('/previews/homepage-v1.html#principles', '/#/?section=principles')
    .replaceAll('/previews/homepage-v1.html#top', '/#/')
    .replaceAll('/previews/curriculum.css', '/lesson/curriculum.css')
    .replaceAll('/previews/wall-v1.css', '/lesson/wall.css')
    .replaceAll('UI 预览 · 墙体目录', '墙体章节')
    .replaceAll('二级目录预览', '章节目录')
    .replaceAll('墙体目录预览 · 仅用于版式确认', '墙体章节')
    .replaceAll('href="/lesson/', `href="${siteBase}lesson/`)
    .replaceAll('href="/#/', `href="${siteBase}#/`)
    .replaceAll('src="/brand/', `src="${siteBase}brand/`)
    .replaceAll('src="/images/', `src="${siteBase}images/`)
    .replaceAll('href="/favicon.svg"', `href="${siteBase}favicon.svg"`);
}
