import { initDirectoryMotion } from './directory-motion.js';

// The React course host initializes frames after measuring their full height.
if (window.top === window.self) {
  let dispose = initDirectoryMotion(document);
  window.addEventListener('pagehide', () => dispose());
  window.addEventListener('pageshow', event => {
    if (event.persisted) dispose = initDirectoryMotion(document);
  });
}
