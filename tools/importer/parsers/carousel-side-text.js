/* eslint-disable */
/* global WebImporter */
/**
 * Parser: carousel-side-text
 * Source: #home-carousel (Bootstrap carousel on https://www.nap.edu.au)
 * Carousel convention: 2 columns, one row per slide (.carousel-inner > .item):
 *   cell 1 = linked promo image (the <a> wrapping the <img>; empty sibling <a>s ignored)
 *   cell 2 = caption panel content (.carousel-caption .sfContentBlock)
 * Carousel indicators / controls are dropped.
 */
function cleanCaption(container) {
  // unwrap inline styled spans, drop style attributes
  container.querySelectorAll('span').forEach((span) => span.replaceWith(...span.childNodes));
  container.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  // remove stray top-level <br>s and empty wrappers
  [...container.querySelectorAll('br')].forEach((br) => {
    if (br.parentElement === container) br.remove();
  });
  [...container.querySelectorAll('div, p')].reverse().forEach((el) => {
    if (!el.textContent.trim() && !el.querySelector('img, picture, a')) el.remove();
  });
  return [...container.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
}

export default function parse(element, { document }) {
  const inner = element.querySelector('.carousel-inner') || element;
  const items = [...inner.children].filter((c) => c.classList.contains('item'));
  const cells = [];

  items.forEach((item) => {
    // cell 1: linked image (only the <a> that actually contains the <img>)
    let imageCell = '';
    const img = [...item.querySelectorAll('img')].find((i) => !i.closest('.carousel-caption'));
    if (img) {
      img.removeAttribute('style');
      img.removeAttribute('data-displaymode');
      const link = img.closest('a');
      if (link && item.contains(link) && link.getAttribute('href')) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.append(img);
        imageCell = a;
      } else {
        imageCell = img;
      }
    }

    // cell 2: caption / text panel
    let textCell = '';
    const caption = item.querySelector('.carousel-caption');
    if (caption) {
      const content = caption.querySelector('.sfContentBlock') || caption;
      const nodes = cleanCaption(content);
      if (nodes.length) textCell = nodes;
    }

    if (imageCell || textCell) cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-side-text', cells });
  element.replaceWith(block);
}
