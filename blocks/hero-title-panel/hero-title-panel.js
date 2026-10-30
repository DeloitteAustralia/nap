import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero with a banner photo and a separate title panel (title not overlaid).
 * Rows: [image], [title + optional subheading/CTA]. Rows may be missing or merged.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const media = document.createElement('div');
  media.className = 'hero-title-panel-media';
  const panel = document.createElement('div');
  panel.className = 'hero-title-panel-panel';

  cells.forEach((cell) => {
    const pictures = [...cell.querySelectorAll('picture')];
    pictures.forEach((pic) => {
      const p = pic.closest('p');
      media.append(pic);
      if (p && !p.textContent.trim() && !p.children.length) p.remove();
    });
    if (cell.textContent.trim() || cell.children.length) {
      panel.append(...cell.childNodes);
    }
  });

  media.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]));
  });

  const children = [];
  if (media.children.length) children.push(media);
  else block.classList.add('no-image');
  if (panel.textContent.trim()) children.push(panel);
  block.replaceChildren(...children);
}
