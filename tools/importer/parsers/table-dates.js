/* eslint-disable */
/* global WebImporter */
/**
 * Parser: table-dates
 * Source: table.k-table with thead (key-dates page)
 * Row 1: header cells (plain bold text); following rows: data rows.
 * rowspan/colspan are expanded into a full grid; continuation cells are left empty.
 */
export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) return;
  table.querySelectorAll('.k-table-resize-handle-wrapper, .k-column-resize-handle-wrapper, .k-row-resize-handle-wrapper').forEach((el) => el.remove());

  const ownRows = (section) => (section ? [...section.children].filter((r) => r.tagName === 'TR') : []);
  const thead = [...table.children].find((c) => c.tagName === 'THEAD');
  const headRows = ownRows(thead);
  const bodySections = [...table.children].filter((c) => c.tagName === 'TBODY');
  const bodyRows = bodySections.length ? bodySections.flatMap(ownRows) : ownRows(table);

  const cleanHeader = (td) => {
    const text = td.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const strong = document.createElement('strong');
    strong.textContent = text;
    return strong;
  };

  const cleanData = (td) => {
    td.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
    const nodes = [...td.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
    return nodes.length ? nodes : '';
  };

  // Build a grid that honours rowspan/colspan
  const buildGrid = (rows, mapper) => {
    const grid = [];
    rows.forEach((tr, r) => {
      grid[r] = grid[r] || [];
      let c = 0;
      [...tr.children].filter((td) => td.tagName === 'TD' || td.tagName === 'TH').forEach((td) => {
        while (grid[r][c] !== undefined) c += 1;
        const rs = Math.max(1, parseInt(td.getAttribute('rowspan') || '1', 10) || 1);
        const cs = Math.max(1, parseInt(td.getAttribute('colspan') || '1', 10) || 1);
        for (let i = 0; i < rs && r + i < rows.length; i += 1) {
          grid[r + i] = grid[r + i] || [];
          for (let j = 0; j < cs; j += 1) {
            grid[r + i][c + j] = (i === 0 && j === 0) ? mapper(td) : '';
          }
        }
        c += cs;
      });
    });
    return grid;
  };

  const all = [...buildGrid(headRows, cleanHeader), ...buildGrid(bodyRows, cleanData)];
  const width = all.reduce((m, row) => Math.max(m, row.length), 0);

  const cells = all.map((row) => {
    const full = [];
    for (let i = 0; i < width; i += 1) full.push(row[i] === undefined ? '' : row[i]);
    return full;
  });

  // header cells with a background colour (e.g. proficiency cut points table) -> "shaded" option
  const firstRow = headRows[0] || bodyRows[0];
  const shaded = !!firstRow && [...firstRow.children].some((c) => /background(-color)?\s*:/i.test(c.getAttribute('style') || ''));

  const block = WebImporter.Blocks.createBlock(document, { name: shaded ? 'table-dates (shaded)' : 'table-dates', cells });
  element.replaceWith(block);
}
