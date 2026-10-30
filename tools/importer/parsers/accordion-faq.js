/* eslint-disable */
/* global WebImporter */
/**
 * Parser: accordion-faq
 * Source: .panel-group
 * One row per .panel: [question text], [panel body content]
 */
export default function parse(element, { document }) {
  const cells = [];
  const panels = [...element.querySelectorAll('.panel')]
    .filter((panel) => panel.closest('.panel-group') === element);

  panels.forEach((panel) => {
    const titleEl = panel.querySelector('.panel-title a') || panel.querySelector('.panel-title');
    let question = '';
    if (titleEl) {
      const clone = titleEl.cloneNode(true);
      clone.querySelectorAll('.glyphicon').forEach((s) => s.remove());
      question = clone.textContent.replace(/\s+/g, ' ').trim();
    }
    if (!question) return;

    const body = panel.querySelector('.panel-body');
    const answer = body
      ? [...body.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim())
      : [];
    cells.push([question, answer.length ? answer : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
