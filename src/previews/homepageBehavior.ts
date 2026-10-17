/** Interaction logic shared by the standalone preview and the formal homepage. */
export function initHomepageInteractions(root: HTMLElement, options: { spaAnchors?: boolean } = {}) {
  const cleanups: Array<() => void> = [];
  const bind = (target: EventTarget, type: string, listener: EventListener, options?: AddEventListenerOptions) => {
    target.addEventListener(type, listener, options);
    cleanups.push(() => target.removeEventListener(type, listener, options));
  };
  const find = <T extends Element>(selector: string) => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Homepage element missing: ${selector}`);
    return node;
  };
  const sidebarToggle = find<HTMLButtonElement>('#sidebar-toggle');
  const sidebar = find<HTMLElement>('#preview-sidebar');
  const mobileMenuToggle = find<HTMLButtonElement>('#mobile-menu-toggle');
  const mobileNavClose = find<HTMLButtonElement>('#mobile-nav-close');
  const mobileBackdrop = find<HTMLButtonElement>('#mobile-backdrop');
  const nav = find<HTMLElement>('#preview-nav');
  const main = find<HTMLElement>('.main');
  const mobileMedia = window.matchMedia('(max-width: 760px)');

  function setMobileNavOpen(open: boolean, returnFocus = false) {
    root.classList.toggle('mobile-nav-open', open);
    document.body.classList.toggle('mobile-nav-open', open);
    mobileMenuToggle.setAttribute('aria-expanded', String(open));
    mobileMenuToggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    sidebar.inert = mobileMedia.matches && !open;
    main.inert = mobileMedia.matches && open;
    if (open) mobileNavClose.focus();
    else if (returnFocus && mobileMedia.matches) mobileMenuToggle.focus();
  }

  bind(sidebarToggle, 'click', () => {
    const collapsed = root.classList.toggle('sidebar-collapsed');
    sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    sidebarToggle.setAttribute('aria-label', collapsed ? '展开侧边导航' : '折叠侧边导航');
    sidebarToggle.title = collapsed ? '展开侧边导航' : '折叠侧边导航';
  });
  bind(mobileMenuToggle, 'click', () => setMobileNavOpen(true));
  bind(mobileNavClose, 'click', () => setMobileNavOpen(false, true));
  bind(mobileBackdrop, 'click', () => setMobileNavOpen(false, true));
  bind(nav, 'click', event => {
    if (mobileMedia.matches && (event.target as Element).closest('a')) setMobileNavOpen(false, true);
  });
  bind(document, 'keydown', event => {
    if ((event as KeyboardEvent).key === 'Escape' && root.classList.contains('mobile-nav-open')) setMobileNavOpen(false, true);
  });
  bind(mobileMedia, 'change', () => {
    setMobileNavOpen(false);
    if (mobileMedia.matches) {
      root.classList.remove('sidebar-collapsed');
      sidebarToggle.setAttribute('aria-expanded', 'true');
      sidebarToggle.setAttribute('aria-label', '折叠侧边导航');
      sidebarToggle.title = '折叠侧边导航';
    }
  });
  sidebar.inert = mobileMedia.matches;

  const sectionNavigation = ['top', 'introduction', 'modules', 'principles'].map(id => ({
    link: find<HTMLAnchorElement>(`#preview-nav a[href="#${id}"]`),
    section: find<HTMLElement>(`#${id}`),
  }));
  let navigationFrame = 0;

  function selectNavigation(link: HTMLAnchorElement) {
    sectionNavigation.forEach(item => {
      const selected = item.link === link;
      item.link.classList.toggle('active', selected);
      if (selected) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
  }

  function updateNavigation() {
    navigationFrame = 0;
    // The SPA retains the homepage while other routes hide it with display:none.
    if (!root.getClientRects().length) return;
    const activationLine = Math.min(180, window.innerHeight * 0.3);
    let current = sectionNavigation[0];
    for (const item of sectionNavigation) {
      if (item.section.getBoundingClientRect().top <= activationLine) current = item;
      else break;
    }
    selectNavigation(current.link);
  }

  function scheduleNavigation() {
    if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
  }

  bind(window, 'scroll', scheduleNavigation, { passive: true });
  bind(window, 'resize', scheduleNavigation);
  bind(nav, 'click', event => {
    const click = event as MouseEvent;
    if (click.button !== 0 || click.metaKey || click.ctrlKey || click.altKey || click.shiftKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a');
    if (link && sectionNavigation.some(item => item.link === link)) selectNavigation(link);
  });
  const navigationResize = new ResizeObserver(scheduleNavigation);
  navigationResize.observe(root);
  sectionNavigation.forEach(item => navigationResize.observe(item.section));
  cleanups.push(() => { navigationResize.disconnect(); cancelAnimationFrame(navigationFrame); });
  scheduleNavigation();

  if (options.spaAnchors) {
    bind(root, 'click', event => {
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor || !root.contains(anchor)) return;
      const target = root.querySelector<HTMLElement>(anchor.getAttribute('href')!);
      if (!target) return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }

  const heroTrack = find<HTMLElement>('#hero-track');
  const heroViewport = find<HTMLElement>('#hero-viewport');
  const heroSlides = [...heroTrack.querySelectorAll<HTMLElement>('.hero-slide')];
  const heroPrev = find<HTMLButtonElement>('#hero-prev');
  const heroNext = find<HTMLButtonElement>('#hero-next');
  const heroAnnouncement = find<HTMLElement>('#hero-announcement');
  const heroTemplate = heroSlides[0];
  const heroTemplateCopy = heroTemplate.querySelector<HTMLElement>('.hero-copy')!;
  const heroTemplateVisual = heroTemplate.querySelector<HTMLElement>('.hero-right')!;
  let heroIndex = 0;
  let touchStart: { x: number; y: number } | null = null;
  let heroResizeFrame = 0;

  function sizeHero() {
    // The first preview owns the frame. Switching or loading another preview
    // must not move the page, its artwork, or the edge controls vertically.
    const height = heroTemplate.getBoundingClientRect().height;
    if (!height) return;
    heroViewport.style.height = `${height}px`;
    heroTrack.style.setProperty('--hero-slide-height', `${height}px`);
    heroTrack.style.setProperty('--hero-copy-height', `${heroTemplateCopy.getBoundingClientRect().height}px`);
    heroTrack.style.setProperty('--hero-visual-height', `${heroTemplateVisual.getBoundingClientRect().height}px`);
    // Keep edge controls beside the preview when the layout stacks on mobile.
    const stacked = heroTemplateVisual.offsetTop > heroTemplateCopy.offsetTop + 40;
    const stage = heroTemplateVisual.querySelector<HTMLElement>('.node-model-stage') ?? heroTemplateVisual;
    const stageRect = stage.getBoundingClientRect();
    const center = stacked ? stageRect.top - heroViewport.getBoundingClientRect().top + stageRect.height / 2 : height / 2;
    root.style.setProperty('--hero-control-y', `${center}px`);
  }

  const heroResize = new ResizeObserver(() => {
    cancelAnimationFrame(heroResizeFrame);
    heroResizeFrame = requestAnimationFrame(sizeHero);
  });
  [heroTemplate, heroTemplateCopy, heroTemplateVisual].forEach(element => heroResize.observe(element));
  cleanups.push(() => { heroResize.disconnect(); cancelAnimationFrame(heroResizeFrame); });

  function showHero(index: number) {
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroTrack.style.transform = `translate3d(-${heroIndex * 100}%, 0, 0)`;
    heroAnnouncement.textContent = heroSlides[heroIndex].getAttribute('aria-label');
    heroSlides.forEach((slide, slideIndex) => {
      const inactive = slideIndex !== heroIndex;
      slide.inert = inactive;
      slide.setAttribute('aria-hidden', String(inactive));
    });
    sizeHero();
    window.dispatchEvent(new CustomEvent('preview-hero-change', { detail: heroIndex }));
  }

  bind(heroPrev, 'click', () => showHero(heroIndex - 1));
  bind(heroNext, 'click', () => showHero(heroIndex + 1));
  bind(heroViewport, 'touchstart', event => {
    const touchEvent = event as TouchEvent;
    if ((touchEvent.target as Element).closest('.node-model-root, .training-model-stage, .savoye-model')) {
      touchStart = null;
      return;
    }
    const touch = touchEvent.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  bind(heroViewport, 'touchend', event => {
    if (!touchStart) return;
    const touch = (event as TouchEvent).changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) showHero(heroIndex + (deltaX < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  showHero(0);
  return () => {
    cleanups.forEach(cleanup => cleanup());
    document.body.classList.remove('mobile-nav-open');
    main.inert = false;
  };
}
