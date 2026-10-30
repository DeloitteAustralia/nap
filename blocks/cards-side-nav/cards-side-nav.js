function normalizePath(path) {
  return path.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}

/**
 * True when the link points at the current page. Also matches when the
 * current path ends with the link path (e.g. local preview under /content/...).
 * @param {HTMLAnchorElement} link
 * @param {string} current normalized current path
 */
function isCurrent(link, current) {
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  const path = normalizePath(url.pathname);
  // path always starts with '/', so endsWith only matches whole segments
  return path === current || (path !== '/' && current.endsWith(path));
}

let navCount = 0;

/**
 * Stacked side navigation: one row per section page, optionally followed by a
 * nested list of sub-pages. The item matching the current URL is marked active;
 * nested lists are collapsible, expanded only for the active branch.
 * @param {Element} block
 */
export default function decorate(block) {
  navCount += 1;
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Section navigation');
  const ul = document.createElement('ul');
  ul.className = 'cards-side-nav-list';
  const current = normalizePath(window.location.pathname);

  [...block.children].forEach((row, rowIndex) => {
    if (!row.textContent.trim()) return;
    const li = document.createElement('li');
    li.className = 'cards-side-nav-item';

    const link = row.querySelector('a[href]');
    const subList = row.querySelector('ul, ol');

    if (link) {
      link.classList.remove('button', 'primary', 'secondary');
      link.className = link.className.trim();
      if (!link.className) link.removeAttribute('class');
      li.append(link);
    } else {
      // no link authored: keep the text as a plain label
      const label = document.createElement('span');
      label.className = 'cards-side-nav-label';
      label.textContent = row.textContent.trim();
      li.append(label);
    }

    let subnav;
    if (subList && subList.querySelector('li')) {
      subnav = document.createElement('ul');
      subnav.className = 'cards-side-nav-subnav';
      subnav.id = `cards-side-nav-${navCount}-sub-${rowIndex}`;
      [...subList.querySelectorAll(':scope > li')].forEach((subItem) => {
        const subLi = document.createElement('li');
        subLi.append(...subItem.childNodes);
        const subLink = subLi.querySelector('a[href]');
        subLink?.classList.remove('button');
        if (subLink && isCurrent(subLink, current)) {
          subLi.classList.add('active');
          subLink.setAttribute('aria-current', 'page');
          li.classList.add('expanded');
        }
        subnav.append(subLi);
      });
      li.classList.add('parent');
      li.append(subnav);
    }

    if (link && isCurrent(link, current)) {
      li.classList.add('active', 'expanded');
      link.setAttribute('aria-current', 'page');
    }

    if (subnav) {
      const expanded = li.classList.contains('expanded');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'cards-side-nav-toggle';
      toggle.setAttribute('aria-controls', subnav.id);
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', `${(link || li).textContent.trim()} sub-pages`);
      subnav.hidden = !expanded;
      subnav.before(toggle);
    }

    ul.append(li);
  });

  ul.addEventListener('click', (e) => {
    const toggle = e.target.closest('.cards-side-nav-toggle');
    if (!toggle) return;
    const item = toggle.closest('.cards-side-nav-item');
    const subnav = item.querySelector('.cards-side-nav-subnav');
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    item.classList.toggle('expanded', expanded);
    subnav.hidden = !expanded;
  });

  nav.append(ul);
  block.replaceChildren(nav);
}
