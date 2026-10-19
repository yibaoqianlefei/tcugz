import { mountArt } from './theme.js?v=20261011-6';

// The selected B composition stays fixed while chapter anchors remain usable.
if (document.body.classList.contains('chapter-page')) {
  document.body.dataset.concept = 'boundary';
  mountArt(document.querySelector('#concept-art'), 'boundary');
}


