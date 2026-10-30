const DATE_PATTERN = /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$|^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$|^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

function isLinkOnly(el) {
  if (el.tagName !== 'P') return false;
  const link = el.querySelector('a');
  return !!link && el.textContent.trim() === link.textContent.trim();
}

function isDate(el) {
  const text = el.textContent.trim();
  if (!text || el.querySelector('a')) return false;
  if (DATE_PATTERN.test(text)) return true;
  // a short paragraph that is entirely bold is how the source marks the date
  const strong = el.querySelector(':scope > strong, :scope > b');
  return el.tagName === 'P' && !!strong && strong.textContent.trim() === text && text.length <= 40;
}

/**
 * News list without images: one row per item with title, date, summary and link.
 * Content may sit in one cell or be split across several.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim()) return;
    const li = document.createElement('li');
    li.className = 'cards-news-item';
    const body = document.createElement('div');
    body.className = 'cards-news-item-body';
    [...row.children].forEach((cell) => body.append(...cell.childNodes));

    // wrap stray text nodes so every child is an element
    [...body.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const p = document.createElement('p');
        node.replaceWith(p);
        p.append(node);
      }
    });

    const children = [...body.children];
    const title = children.find((el) => /^H[1-6]$/.test(el.tagName)) || children.find((el) => !isDate(el) && !isLinkOnly(el)) || null;
    if (title) title.classList.add('cards-news-item-title');

    const date = children.find((el) => el !== title && isDate(el));
    if (date) {
      date.classList.add('cards-news-item-date');
      const text = date.textContent.trim();
      const parsed = new Date(text);
      if (!Number.isNaN(parsed.getTime())) {
        const time = document.createElement('time');
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        time.dateTime = `${yyyy}-${mm}-${dd}`;
        time.append(...date.childNodes);
        date.append(time);
      }
    }

    const lastLink = [...children].reverse().find((el) => el !== title && isLinkOnly(el));
    if (lastLink) {
      lastLink.classList.add('cards-news-item-cta');
      const a = lastLink.querySelector('a');
      // generic "read more" links get hidden context that says which item they open
      const titleText = title ? title.textContent.trim() : '';
      if (titleText && !a.getAttribute('aria-label') && /^(read more|more|learn more)$/i.test(a.textContent.trim())) {
        const context = document.createElement('span');
        context.className = 'visually-hidden';
        context.textContent = ` about ${titleText}`;
        a.append(context);
      }
    }

    children.forEach((el) => {
      if (el !== title && el !== date && el !== lastLink && el.tagName === 'P') el.classList.add('cards-news-item-summary');
    });

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
