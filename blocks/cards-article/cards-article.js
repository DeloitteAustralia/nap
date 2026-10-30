import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Article cards: one row per card; cell 1 image, cell 2 heading, text and link.
 * Cells may be missing, merged into one, or in the other order.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-article-card';

    const image = document.createElement('div');
    image.className = 'cards-article-card-image';
    const body = document.createElement('div');
    body.className = 'cards-article-card-body';

    [...row.children].forEach((cell) => {
      const pictures = [...cell.querySelectorAll('picture')];
      if (pictures.length && !image.children.length) {
        const picture = pictures[0];
        const wrap = picture.closest('a') || picture;
        const p = wrap.closest('p');
        image.append(wrap);
        if (p && !p.textContent.trim() && !p.querySelector('picture, img')) p.remove();
      }
      if (cell.textContent.trim() || cell.querySelector('picture, img')) body.append(...cell.childNodes);
    });

    // a link alone in the last paragraph is the card's call to action
    const last = body.lastElementChild;
    const cta = last && last.tagName === 'P' && last.children.length === 1 && last.querySelector(':scope > a, :scope > strong > a, :scope > em > a');
    if (cta && last.textContent.trim() === cta.textContent.trim()) {
      last.classList.add('cards-article-card-cta');
      // generic "Read more" links get hidden context so each link text is unique
      const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && /^(read more|more|learn more)$/i.test(cta.textContent.trim())) {
        const context = document.createElement('span');
        context.className = 'visually-hidden';
        context.textContent = ` about ${heading.textContent.trim()}`;
        cta.append(context);
      }
    }

    if (image.children.length) li.append(image);
    else li.classList.add('no-image');
    if (body.children.length || body.textContent.trim()) li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
