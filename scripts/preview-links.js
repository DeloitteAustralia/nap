/*
 * Local preview only: pages are served under /content/ (e.g. /content/about), so site links
 * like "/about" would 404. Loaded by scripts.js only when the page path starts with /content/;
 * it never runs on the published site.
 */
const PREFIX = '/content';
const ASSET_PATH = /^\/(content|blocks|scripts|styles|icons|fonts|media_)|\.[a-z0-9]+$/i;

function previewHref(a) {
  const raw = a.getAttribute('href');
  if (!raw || raw.startsWith('#') || a.dataset.previewHref) return;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin || ASSET_PATH.test(url.pathname)) return;
  const path = url.pathname === '/' ? '/index' : url.pathname.replace(/\/$/, '');
  a.dataset.previewHref = raw;
  a.setAttribute('href', `${PREFIX}${path}${url.search}${url.hash}`);
}

['mouseover', 'focusin', 'touchstart', 'click'].forEach((type) => {
  document.addEventListener(type, (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a) previewHref(a);
  }, { capture: true, passive: true });
});
