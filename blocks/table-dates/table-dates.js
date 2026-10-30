/*
 * Table Dates block
 * First authored row is the header row; following rows are data rows.
 * Renders a semantic <table> with <thead>/<tbody>.
 *
 * Merged cells: authors leave the repeated cell empty in the following rows.
 * An empty body cell continues the cell above it (rowspan) when every cell to
 * its left in the same row is also a continuation, so merges stay nested
 * inside their parent group (e.g. Assessment type > Year > Period).
 *
 * Option "shaded": blue header row, row headers and alternate shaded row groups.
 */

function isEmptyCell(cell) {
  return !cell.textContent.trim()
    && !cell.querySelector('img, picture, svg, video, iframe, input, select, textarea');
}

/**
 * Rebuild source rowspans from empty continuation cells.
 * @param {HTMLTableRowElement[]} rows body rows, each padded to `columns` cells
 * @param {number} columns column count
 */
function mergeContinuations(rows, columns) {
  const grid = rows.map((tr) => [...tr.children]);
  const anchors = new Array(columns).fill(null);

  grid.forEach((cells, r) => {
    let continuing = r > 0;
    cells.forEach((cell, c) => {
      if (continuing && anchors[c] && isEmptyCell(cell)) {
        anchors[c].rowSpan += 1;
        cell.remove();
        cells[c] = null;
        return;
      }
      continuing = false;
      anchors[c] = isEmptyCell(cell) ? null : cell;
    });

    // A group label row whose trailing cells are empty and whose next row
    // continues the label is a rowspan spacer: drop the empty trailing cells.
    const next = grid[r + 1];
    if (!next) return;
    let k = columns;
    while (k > 1 && cells[k - 1] && isEmptyCell(cells[k - 1])) k -= 1;
    if (k === columns || !cells[k - 1]) return;
    const nextContinues = next.slice(0, k).every((cell) => isEmptyCell(cell));
    if (!nextContinues) return;
    for (let c = k; c < columns; c += 1) {
      cells[c].remove();
      cells[c] = null;
      anchors[c] = null;
    }
  });
}

/**
 * "shaded" option: the first cell of each row group becomes a row header and
 * alternate groups get a shaded background (source: proficiency cut points table).
 * @param {HTMLTableSectionElement} tbody
 * @param {number} columns column count
 */
function decorateShaded(tbody, columns) {
  let group = -1;
  [...tbody.children].forEach((tr) => {
    // a row that still has every cell starts a group; continuation rows lost their first cell
    if (tr.children.length === columns) {
      group += 1;
      const first = tr.firstElementChild;
      const th = document.createElement('th');
      th.scope = 'row';
      th.rowSpan = first.rowSpan;
      th.append(...first.childNodes);
      first.replaceWith(th);
    }
    if (group % 2 === 0) tr.classList.add('table-dates-row-shaded');
  });
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length);
  if (!rows.length) {
    block.replaceChildren();
    return;
  }

  const columns = Math.max(...rows.map((row) => row.children.length));
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, i) => {
    const isHeader = i === 0;
    const tr = document.createElement('tr');
    const cells = [...row.children];

    for (let c = 0; c < columns; c += 1) {
      const cell = document.createElement(isHeader ? 'th' : 'td');
      if (isHeader) cell.setAttribute('scope', 'col');
      // pad short rows so every row spans the full column grid
      if (cells[c]) cell.append(...cells[c].childNodes);
      tr.append(cell);
    }

    (isHeader ? thead : tbody).append(tr);
  });

  mergeContinuations([...tbody.children], columns);
  if (block.classList.contains('shaded')) decorateShaded(tbody, columns);

  table.append(thead);
  if (tbody.children.length) table.append(tbody);
  block.replaceChildren(table);
}
