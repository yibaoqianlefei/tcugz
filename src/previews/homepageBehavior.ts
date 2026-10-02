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
  bind(find('#preview-nav'), 'click', event => {
    if (mobileMedia.matches && (event.target as Element).closest('a')) setMobileNavOpen(false);
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

  if (options.spaAnchors) {
    bind(root, 'click', event => {
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor || !root.contains(anchor)) return;
      const target = root.querySelector<HTMLElement>(anchor.getAttribute('href')!);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const heroTrack = find<HTMLElement>('#hero-track');
  const heroViewport = find<HTMLElement>('#hero-viewport');
  const heroSlides = [...heroTrack.querySelectorAll<HTMLElement>('.hero-slide')];
  const heroPrev = find<HTMLButtonElement>('#hero-prev');
  const heroNext = find<HTMLButtonElement>('#hero-next');
  const heroAnnouncement = find<HTMLElement>('#hero-announcement');
  let heroIndex = 0;
  let touchStart: { x: number; y: number } | null = null;

  function showHero(index: number) {
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroTrack.style.transform = `translate3d(-${heroIndex * 100}%, 0, 0)`;
    heroAnnouncement.textContent = heroSlides[heroIndex].getAttribute('aria-label');
    heroSlides.forEach((slide, slideIndex) => {
      const inactive = slideIndex !== heroIndex;
      slide.inert = inactive;
      slide.setAttribute('aria-hidden', String(inactive));
    });
    window.dispatchEvent(new CustomEvent('preview-hero-change', { detail: heroIndex }));
  }

  bind(heroPrev, 'click', () => showHero(heroIndex - 1));
  bind(heroNext, 'click', () => showHero(heroIndex + 1));
  bind(heroViewport, 'touchstart', event => {
    const touchEvent = event as TouchEvent;
    if ((touchEvent.target as Element).closest('.node-model-root, .training-model-stage')) {
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

  const hotspots = [...root.querySelectorAll<HTMLButtonElement>('.case-hotspot')];
  hotspots.forEach(button => bind(button, 'click', () => {
    hotspots.forEach(marker => {
      const selected = marker === button;
      marker.classList.toggle('is-selected', selected);
      marker.setAttribute('aria-pressed', String(selected));
    });
    find<HTMLElement>('#case-current').textContent = `节点 ${button.dataset.case} / 03`;
  }));

  showHero(0);
  return () => {
    cleanups.forEach(cleanup => cleanup());
    document.body.classList.remove('mobile-nav-open');
    main.inert = false;
  };
}
