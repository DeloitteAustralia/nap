/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns
 * Source: table.k-table without thead (layout table on /resources)
 * One block row per tr, one cell per td (images, lists, links preserved).
 */
export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) return;
  table.querySelectorAll('.k-table-resize-handle-wrapper, .k-column-resize-handle-wrapper, .k-row-resize-handle-wrapper').forEach((el) => el.remove());

  const sections = [...table.children].filter((c) => c.tagName === 'TBODY');
  const rows = (sections.length ? sections : [table])
    .flatMap((s) => [...s.children].filter((r) => r.tagName === 'TR'));

  const rowCells = rows.map((tr) => [...tr.children]
    .filter((td) => td.tagName === 'TD' || td.tagName === 'TH')
    .map((td) => {
      td.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
      const nodes = [...td.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
      return nodes.length ? nodes : '';
    }))
    .filter((r) => r.some((c) => c !== ''));

  const width = rowCells.reduce((m, r) => Math.max(m, r.length), 0);
  const cells = rowCells.map((r) => {
    const full = [...r];
    while (full.length < width) full.push('');
    return full;
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
