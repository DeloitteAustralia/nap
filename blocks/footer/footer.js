/**
 * Fetches the footer fragment (local preview first, then site root on DA/EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchFooter() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
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
    img.loading = 'lazy';
  });
}

/**
 * Opens off-site links in a new tab, as on the source site.
 * @param {Element} root
 */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin && !url.hostname.endsWith('nap.edu.au')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * Flags lists whose items are only image links (social icons, badges).
 * @param {Element} root
 */
function decorateImageLists(root) {
  root.querySelectorAll('ul').forEach((ul) => {
    const items = [...ul.children];
    const imageOnly = items.length && items.every((li) => li.querySelector('img') && !li.textContent.trim());
    ul.classList.add(imageOnly ? 'footer-image-links' : 'footer-link-list');
    // Safari drops list semantics from unstyled lists outside <nav>
    ul.setAttribute('role', 'list');
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const data = await fetchFooter();
  block.textContent = '';
  if (!data) return;

  const fragment = document.createElement('div');
  fragment.innerHTML = data.html;
  resolveImages(fragment, data.base);
  decorateExternalLinks(fragment);
  decorateImageLists(fragment);

  // sections with a heading are link columns; the rest form the bottom bar
  const sections = [...fragment.querySelectorAll(':scope > div')];
  const columns = sections.filter((s) => s.querySelector('h1, h2, h3, h4, h5, h6'));
  const bottom = sections.filter((s) => !columns.includes(s));

  const links = document.createElement('div');
  links.className = 'footer-links';
  const linksInner = document.createElement('div');
  linksInner.className = 'footer-inner footer-columns';
  columns.forEach((col) => {
    col.className = 'footer-column';
    linksInner.append(col);
  });
  links.append(linksInner);

  const bar = document.createElement('div');
  bar.className = 'footer-bottom';
  const barInner = document.createElement('div');
  barInner.className = 'footer-inner';
  bottom.forEach((section) => {
    section.className = section.querySelector('.footer-image-links') ? 'footer-badges' : 'footer-legal';
    barInner.append(section);
  });
  bar.append(barInner);

  block.append(links, bar);
}
