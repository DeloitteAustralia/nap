/* eslint-disable */
/* global WebImporter */
/**
 * Parser: quote-indented
 * Source: .main-content-text p[style*="margin-left"]
 * One row: [quotation paragraph]
 */
export default function parse(element, { document }) {
  const p = document.createElement('p');
  p.innerHTML = element.innerHTML;
  p.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));

  const cells = [[p]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'quote-indented', cells });
  element.replaceWith(block);
}
