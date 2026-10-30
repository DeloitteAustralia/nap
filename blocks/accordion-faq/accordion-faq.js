/*
 * Accordion FAQ block
 * One authored row per item: cell 1 question, cell 2 answer.
 * Each row becomes a native <details>/<summary> disclosure, collapsed by default.
 */

let groupCount = 0;

export default function decorate(block) {
  // shared name: opening one item closes the others (matches the source's data-parent accordion)
  groupCount += 1;
  const groupName = `accordion-faq-${groupCount}`;

  [...block.children].forEach((row) => {
    const [questionCell, answerCell] = row.children;
    const questionText = questionCell?.textContent.trim();

    // skip rows without a question (empty or malformed authoring)
    if (!questionCell || !questionText) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    // unwrap a single paragraph/heading so the summary holds inline content only
    const only = questionCell.children.length === 1 ? questionCell.firstElementChild : null;
    const source = only && /^(P|H[1-6])$/.test(only.tagName) ? only : questionCell;
    // question text sits in its own span so hover underline and focus ring hug the text
    const question = document.createElement('span');
    question.className = 'accordion-faq-item-question';
    question.append(...source.childNodes);
    // trailing space lets the glyph wrap to its own line like the source's inline glyph
    summary.append(question, ' ');

    const body = document.createElement('div');
    body.className = 'accordion-faq-item-body';
    if (answerCell) body.append(...answerCell.childNodes);

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.setAttribute('name', groupName);
    details.append(summary, body);
    row.replaceWith(details);
  });
}
