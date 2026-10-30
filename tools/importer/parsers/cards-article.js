/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-article
 * Source: #content1 .bottom-section .row:has(.divarticle) on https://www.nap.edu.au
 * Cards convention: 2 columns, one row per .divarticle article:
 *   cell 1 = .divArticleImage img
 *   cell 2 = .divArticleContent content (h3, paragraphs, "Read more" link in own paragraph)
 * The block is inserted in place of the first .divarticle column and ONLY the
 * .divarticle columns are removed. The What's New column (article.divNewsContent)
 * stays attached to the document for the cards-news parser.
 */
function isBlank(node) {
  return node && ((node.nodeType === 3 && !node.textContent.trim()) || node.nodeName === 'BR');
}

function splitReadMore(content, document) {
  [...content.querySelectorAll('p a')].forEach((a) => {
    if (!/read more/i.test(a.textContent)) return;
    const p = a.closest('p');
    const np = document.createElement('p');
    np.append(a);
    p.after(np);
    // trim trailing <br>/whitespace left in the original paragraph (and its last <strong>)
    while (isBlank(p.lastChild)) p.lastChild.remove();
    const last = p.lastElementChild;
    if (last && last.nodeName === 'STRONG') {
      while (isBlank(last.lastChild)) last.lastChild.remove();
    }
    if (!p.textContent.trim() && !p.querySelector('img')) p.remove();
  });
}

export default function parse(element, { document }) {
  const articles = [...element.querySelectorAll('.divarticle article')];
  if (!articles.length) return;

  // direct-child columns of the row that hold a .divarticle
  const columns = [...element.children].filter((col) => col.querySelector('.divarticle'));

  const cells = [];
  articles.forEach((art) => {
    let imageCell = '';
    const img = art.querySelector('.divArticleImage img');
    if (img) {
      img.removeAttribute('id');
      img.removeAttribute('style');
      imageCell = img;
    }

    let textCell = '';
    const wrap = art.querySelector('.divArticleContent');
    if (wrap) {
      const content = wrap.querySelector('.sfContentBlock') || wrap;
      content.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
      splitReadMore(content, document);
      const nodes = [...content.children].filter((el) => el.textContent.trim() || el.querySelector('img'));
      if (nodes.length) textCell = nodes;
    }

    if (imageCell || textCell) cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  const anchor = columns[0] || articles[0].closest('.divarticle');
  anchor.before(block);
  if (columns.length) {
    columns.forEach((col) => col.remove());
  } else {
    articles.forEach((art) => (art.closest('.divarticle') || art).remove());
  }
}
