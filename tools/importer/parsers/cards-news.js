/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-news
 * Source: #content1 article.divNewsContent (What's New panel on https://www.nap.edu.au)
 * Cards (no images) convention: 1 column, one row per .whatsnew item. The cell holds:
 * h4 title, bold date paragraph, summary paragraph, read more link paragraph.
 * The panel h3 ("What's New") stays as default content immediately before the block.
 * With no .whatsnew items only the heading is left.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector(':scope > h3');
  if (heading) {
    heading.textContent = heading.textContent.trim();
    element.before(heading);
  }

  const items = [...element.querySelectorAll('.whatsnew')];
  const cells = [];

  items.forEach((item) => {
    const content = [];
    const link = item.querySelector('a[href]');

    const titleEl = item.querySelector('h1, h2, h3, h4, h5, h6');
    const titleText = ((titleEl && titleEl.textContent) || (link && link.getAttribute('title')) || '').trim();
    if (titleText) {
      const h4 = document.createElement('h4');
      h4.textContent = titleText;
      content.push(h4);
    }

    const dateEl = item.querySelector('strong, b');
    const dateText = dateEl ? dateEl.textContent.trim() : '';
    if (dateText) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = dateText;
      p.append(strong);
      content.push(p);
    }

    [...item.querySelectorAll('p')].forEach((p) => {
      if (!p.textContent.trim() || p.contains(dateEl) || (link && p.contains(link))) return;
      p.removeAttribute('style');
      content.push(p);
    });

    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      if (link.getAttribute('title')) a.title = link.getAttribute('title');
      a.textContent = link.textContent.trim() || 'read more';
      const p = document.createElement('p');
      p.append(a);
      content.push(p);
    }

    if (content.length) cells.push([content]);
  });

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });
  element.replaceWith(block);
}
