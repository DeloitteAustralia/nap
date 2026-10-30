/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-side-nav
 * Source: #ULSideNavMenu
 * One row per top-level li: [link (+ nested ul of sub-links)]. span.spanArrow icons dropped.
 */
export default function parse(element, { document }) {
  const list = element.matches('ul') ? element : (element.querySelector('#ULSideNavMenu') || element.querySelector('ul'));

  const cloneLink = (a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    return link;
  };

  const cells = [];
  const items = list ? [...list.children].filter((c) => c.tagName === 'LI') : [];
  items.forEach((li) => {
    const a = [...li.children].find((c) => c.tagName === 'A' && c.getAttribute('href'));
    if (!a || !a.textContent.trim()) return;
    const content = [cloneLink(a)];

    const subList = [...li.children].find((c) => c.tagName === 'UL' || c.tagName === 'OL');
    if (subList) {
      const ul = document.createElement('ul');
      [...subList.children].filter((c) => c.tagName === 'LI').forEach((subLi) => {
        const subA = subLi.querySelector('a[href]');
        if (!subA || !subA.textContent.trim()) return;
        const newLi = document.createElement('li');
        newLi.append(cloneLink(subA));
        ul.append(newLi);
      });
      if (ul.children.length) content.push(ul);
    }
    cells.push([content]);
  });

  // Empty side nav (e.g. /resources): drop it, no block
  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-side-nav', cells });
  element.replaceWith(block);
}
