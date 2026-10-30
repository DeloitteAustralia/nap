// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

// class that switches the page to the larger text size (styles/styles.css)
const TEXT_LARGE_CLASS = 'text-size-large';

const SEARCH_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><g transform="translate(24 0) scale(-1 1)"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15.5 15.5 22 22" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></g></svg>';

/**
 * Fetches the nav fragment (local preview first, then site root on DA/EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchNav() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

/**
 * Resolves fragment-relative image paths against the fragment URL.
 * @param {Element} root
 * @param {string} base
 */
function resolveImages(root, base) {
  root.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
    img.loading = 'eager';
  });
}

function normalizePath(path) {
  const p = path.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/+$/, '');
  return p || '/';
}

/**
 * Marks the nav link matching the current page (also under a /content preview prefix).
 * @param {Element} list
 */
function markCurrent(list) {
  const current = normalizePath(window.location.pathname);
  const links = [...list.querySelectorAll('a[href]')];
  const match = links.find((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const target = normalizePath(url.pathname);
    if (target === '/') return current === '/' || current === '/content';
    return current === target || current.endsWith(target) || current.startsWith(`${target}/`)
      || current.includes(`/content${target}`);
  });
  if (match) {
    match.setAttribute('aria-current', 'page');
    match.closest('li')?.classList.add('active');
  }
}

/**
 * Opens external links in a new tab, as on the source site.
 * @param {Element} root
 */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

function applyTextSize(size) {
  document.documentElement.classList.toggle(TEXT_LARGE_CLASS, size === 'large');
}

/**
 * Builds the text-size buttons and search toggle/panel from the tools section items.
 * Items: [smaller text label, larger text label, search link].
 * @param {Element} section
 */
function buildTools(section) {
  const items = [...section.querySelectorAll('li')];
  const tools = document.createElement('div');
  tools.className = 'nav-tools-controls';

  ['small', 'large'].forEach((size, i) => {
    const label = items[i]?.textContent.trim();
    if (!label) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `nav-text-size nav-text-size-${size}`;
    button.textContent = 'A';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', size === 'small' ? 'true' : 'false');
    button.addEventListener('click', () => {
      applyTextSize(size);
      tools.querySelectorAll('.nav-text-size').forEach((b) => b.setAttribute('aria-pressed', b === button ? 'true' : 'false'));
    });
    tools.append(button);
  });

  const searchLink = items.find((li) => li.querySelector('a'))?.querySelector('a');
  if (searchLink) {
    const action = new URL(searchLink.href, window.location.href);
    const panel = document.createElement('form');
    panel.className = 'nav-search-panel';
    panel.id = 'nav-search';
    panel.method = 'get';
    panel.action = `${action.origin}${action.pathname}`;
    panel.role = 'search';
    panel.hidden = true;
    action.searchParams.forEach((value, name) => {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = name;
      hidden.value = value;
      panel.append(hidden);
    });
    const label = document.createElement('label');
    label.className = 'nav-search-label';
    label.htmlFor = 'nav-search-input';
    label.textContent = searchLink.textContent.trim();
    const input = document.createElement('input');
    input.type = 'search';
    input.id = 'nav-search-input';
    input.name = 'searchQuery';
    input.placeholder = searchLink.textContent.trim();
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'nav-search-submit';
    submit.textContent = '>>';
    submit.setAttribute('aria-label', `Submit ${searchLink.textContent.trim().toLowerCase()}`);
    panel.append(label, input, submit);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-search-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panel.id);
    toggle.setAttribute('aria-label', searchLink.textContent.trim());
    toggle.innerHTML = SEARCH_ICON;
    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) input.focus();
    };
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.focus();
      }
    });
    tools.append(toggle, panel);
  }

  section.replaceChildren(tools);
}

/**
 * Opens/closes the mobile menu (the desktop nav is always shown).
 * @param {Element} nav
 * @param {boolean|null} force
 */
function toggleMenu(nav, force = null) {
  const expanded = force !== null ? force : nav.getAttribute('aria-expanded') !== 'true';
  const button = nav.querySelector('.nav-hamburger');
  if (isDesktop.matches) nav.removeAttribute('aria-expanded');
  else nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (button) {
    const open = expanded && !isDesktop.matches;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
}

/**
 * Builds the mobile menu row: the authored menu label plus the hamburger button.
 * @param {Element} sections
 * @returns {Element}
 */
function buildMenuRow(sections) {
  const row = document.createElement('div');
  row.className = 'nav-menu-row';
  const label = sections.querySelector(':scope > p');
  if (label) {
    label.className = 'nav-menu-label';
    label.setAttribute('aria-hidden', 'true');
    row.append(label);
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-hamburger';
  button.setAttribute('aria-controls', sections.id);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Open navigation');
  button.innerHTML = '<span class="nav-hamburger-icon"></span>';
  row.append(button);
  return row;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navData = await fetchNav();
  block.textContent = '';
  if (!navData) return;

  const fragment = document.createElement('div');
  fragment.innerHTML = navData.html;
  resolveImages(fragment, navData.base);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  const [brand, partners, sections, tools] = [...fragment.querySelectorAll(':scope > div')];

  const top = document.createElement('div');
  top.className = 'nav-top';
  if (brand) {
    brand.className = 'nav-brand';
    top.append(brand);
  }
  if (partners) {
    partners.className = 'nav-partners';
    decorateExternalLinks(partners);
    top.append(partners);
  }

  // mobile order: tools bar, menu row, collapsible links; desktop: links left, tools right
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  if (tools) {
    tools.className = 'nav-tools';
    buildTools(tools);
    bar.append(tools);
  }
  if (sections) {
    sections.className = 'nav-sections';
    sections.id = 'nav-sections-panel';
    markCurrent(sections);
    const menuRow = buildMenuRow(sections);
    menuRow.querySelector('.nav-hamburger').addEventListener('click', () => toggleMenu(nav));
    bar.append(menuRow, sections);
  }

  nav.append(top, bar);
  toggleMenu(nav, false);
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      nav.querySelector('.nav-hamburger')?.focus();
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
