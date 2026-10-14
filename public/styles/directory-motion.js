const revealed = new WeakSet();
const instances = new WeakMap();

/**
 * One gentle entrance per card. The document stays readable without JavaScript.
 * Use the card's own window so standalone and embedded lessons behave alike.
 * @param {Document | HTMLElement} root
 * @returns {() => void}
 */
export function initDirectoryMotion(root) {
  instances.get(root)?.();
  const doc = root.nodeType === 9 ? /** @type {Document} */ (root) : root.ownerDocument;
  const view = doc?.defaultView;
  const cards = [...root.querySelectorAll('.directory-card')];
  if (!view || !cards.length) return () => {};

  const media = view.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  const sequence = new Map();
  const groupCounts = new Map();
  cards.forEach(card => {
    const grid = card.closest('.directory-grid') ?? root;
    const index = groupCounts.get(grid) ?? 0;
    sequence.set(card, index);
    groupCounts.set(grid, index + 1);
  });
  let disposed = false;
  /** @type {IntersectionObserver | null} */
  let observer = null;

  const stopAnimations = () => {
    running.forEach(animation => animation.cancel());
    running.clear();
  };
  const onMotionChange = () => {
    if (!media.matches) return;
    observer?.disconnect();
    stopAnimations();
    cards.forEach(card => revealed.add(card));
  };
  /** @param {Event} event */
  const revealInteraction = event => {
    const card = /** @type {Element | null} */ (event.target)?.closest?.('.directory-card');
    if (!card || !root.contains(card)) return;
    revealed.add(card);
    observer?.unobserve(card);
    running.get(card)?.cancel();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    stopAnimations();
    media.removeEventListener('change', onMotionChange);
    root.removeEventListener('focusin', revealInteraction);
    root.removeEventListener('pointerover', revealInteraction);
    if (instances.get(root) === dispose) instances.delete(root);
  };
  instances.set(root, dispose);

  if (!media.matches && view.IntersectionObserver) {
    observer = new view.IntersectionObserver(entries => {
      if (disposed || media.matches) return;
      entries.forEach(entry => {
        const card = /** @type {HTMLElement} */ (entry.target);
        if (!entry.isIntersecting || revealed.has(card) || !card.isConnected) return;
        revealed.add(card);
        observer?.unobserve(card);
        if (typeof card.animate !== 'function') return;
        // Individual translate composes with the card's CSS hover transform.
        const animation = card.animate([
          { opacity: 0, translate: '0 20px' },
          { opacity: 1, translate: '0 0' },
        ], {
          duration: 540,
          delay: (sequence.get(card) % 3) * (view.innerWidth <= 600 ? 45 : 75),
          easing: 'cubic-bezier(.16, 1, .3, 1)',
          fill: 'backwards',
        });
        running.set(card, animation);
        animation.onfinish = animation.oncancel = () => { running.delete(card); };
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    cards.forEach(card => { if (!revealed.has(card)) observer?.observe(card); });
  }
  media.addEventListener('change', onMotionChange);
  root.addEventListener('focusin', revealInteraction);
  root.addEventListener('pointerover', revealInteraction, { passive: true });
  return dispose;
}
