/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-title-panel
 * Source: .hero-section .containerherosection
 * Rows: [banner image], [title h1]
 */
export default function parse(element, { document }) {
  const root = element.querySelector('.containerherosection') || element;

  const cells = [];

  // Row 1: banner image (skip the decorative image inside the title panel)
  const img = root.querySelector('.hero-image img')
    || [...root.querySelectorAll('img')].find((i) => !i.closest('.hero-page-title'));
  if (img) {
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    image.alt = img.getAttribute('alt') || '';
    cells.push([image]);
  } else {
    cells.push(['']);
  }

  // Row 2: clean h1 title (text lives inside .sfContentBlock)
  const titleSrc = root.querySelector('.hero-page-title h1') || root.querySelector('h1');
  const titleText = titleSrc ? titleSrc.textContent.replace(/\s+/g, ' ').trim() : '';
  if (titleText) {
    const h1 = document.createElement('h1');
    h1.textContent = titleText;
    cells.push([h1]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-title-panel', cells });
  element.replaceWith(block);
}
