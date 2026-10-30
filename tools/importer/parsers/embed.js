/* eslint-disable */
/* global WebImporter */
/**
 * Parser: embed
 * Source: YouTube <iframe> inside an article paragraph (/naplan/results-and-reports).
 * Library convention: one row, one cell holding the URL of the external content (as a link).
 * The block is placed after the paragraph, which keeps its text (e.g. the transcript link).
 */
export default function parse(element, { document }) {
  const iframe = element.matches('iframe') ? element : element.querySelector('iframe');
  if (!iframe || !iframe.getAttribute('src')) return;
  const src = new URL(iframe.getAttribute('src'), 'https://www.nap.edu.au/').href;

  const link = document.createElement('a');
  link.href = src;
  link.textContent = src;
  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells: [[link]] });

  const paragraph = iframe.closest('p');
  if (paragraph) {
    iframe.remove();
    // drop the <br>s / spaces that separated the text from the player
    while (paragraph.lastChild && (paragraph.lastChild.nodeName === 'BR' || !paragraph.lastChild.textContent.trim())) {
      paragraph.lastChild.remove();
    }
    paragraph.after(block);
    if (!paragraph.textContent.trim()) paragraph.remove();
  } else {
    iframe.replaceWith(block);
  }
}
