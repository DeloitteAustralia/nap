/**
 * Indented quotation. Rows: [quotation], [optional attribution].
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.textContent.trim());
  const [quoteRow, ...rest] = rows;
  const blockquote = document.createElement('blockquote');
  if (quoteRow) {
    const cells = [...quoteRow.children];
    (cells.length ? cells : [quoteRow]).forEach((cell) => blockquote.append(...cell.childNodes));
  }
  const children = [blockquote];
  if (rest.length) {
    const cite = document.createElement('p');
    cite.className = 'quote-indented-attribution';
    rest.forEach((row) => cite.append(...[...row.querySelectorAll(':scope > div')].flatMap((c) => [...c.childNodes])));
    children.push(cite);
  }
  block.replaceChildren(...children);
}
