/* eslint-disable */
/* global WebImporter */

/**
 * NAP link transformer.
 * - beforeTransform: maps the source's named anchors (<a name="Writing">) to the id of the
 *   heading they mark, rewrites "#name" links to that id, and unwraps the named anchors
 *   (otherwise they end up as empty links).
 * - afterTransform: links to migrated pages stay relative (EDS-sanitized path, e.g. "--" -> "-");
 *   links to pages or documents that are not migrated yet point to the live NAP site.
 * Must run before nap-cleanup (which drops href-less anchors).
 */

const SOURCE_ORIGIN = 'https://www.nap.edu.au';

// Pages that exist on the new site. Keep in sync with tools/importer/page-templates.json
// (template urls, as EDS paths).
const MIGRATED_PATHS = new Set([
  '/',
  '/about',
  '/nap-sample-assessments',
  '/naplan',
  '/naplan/faqs',
  '/naplan/faqs/naplan-results-reports-performance',
  '/naplan/for-parents-carers',
  '/naplan/for-schools',
  '/naplan/key-dates',
  '/naplan/public-demonstration-site',
  '/naplan/results-and-reports',
  '/naplan/whats-in-the-tests',
  '/resources',
  '/results-and-reports',
]);

// Source named anchors on migrated pages -> heading ids on the new pages, for links from
// other pages (e.g. /naplan/results-and-reports#2026). Same-page links are resolved automatically.
const ANCHOR_ALIASES = {
  '/naplan/results-and-reports': {
    national: 'naplan-national-results',
    schools: 'naplan-results-for-schools',
    isrs: 'naplan-results-for-students-parents-and-carers-individual-student-reports',
    'proficiency-scales-standards': 'naplan-scales-and-proficiency-standards',
    scalesdiagram: 'diagram-naplan-measurement-scales-averaged-across-domains',
    cutpointstable: 'table-naplan-scale-score-cut-points-between-proficiency-levels',
    2026: 'naplan-2026-results',
    techreports: 'naplan-technical-reports',
  },
  '/naplan/whats-in-the-tests': {
    NAPLANAC: 'naplan-aligned-with-the-australian-curriculum',
    Writing: 'writing',
    Reading: 'reading',
    Conventionsoflanguage: 'conventions-of-language',
    Numeracy: 'numeracy',
    PastNAPLANtestpapers: 'past-naplan-test-papers',
  },
};

const DOCUMENT_PATTERN = /\.(pdf|docx?|xlsx?|pptx?|zip|csv|rtf)$/i;
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

function sanitizePath(pathname) {
  const path = pathname.split('/').map((segment) => {
    let s = segment;
    try { s = decodeURIComponent(segment); } catch (e) { /* keep raw */ }
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }).join('/').replace(/\/+$/, '');
  if (!path || path === '/home') return '/';
  return path;
}

function headingId(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
}

function isSourceHost(hostname) {
  return hostname === 'nap.edu.au' || hostname === 'www.nap.edu.au';
}

function unwrap(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  el.remove();
}

/** Maps named anchors to their heading ids and rewrites in-page links. */
function fixNamedAnchors(root) {
  const headings = [...root.querySelectorAll(HEADINGS)];
  const map = {};
  root.querySelectorAll('a[name]:not([href])').forEach((a) => {
    const name = a.getAttribute('name');
    if (name === 'top') return;
    const heading = a.closest(HEADINGS)
      // eslint-disable-next-line no-bitwise
      || headings.find((h) => a.compareDocumentPosition(h) & 4);
    if (heading && heading.textContent.trim()) map[name] = headingId(heading.textContent.trim());
    if (a.textContent.trim() || a.querySelector('img')) unwrap(a);
    else a.remove();
  });
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const target = map[decodeURIComponent(a.getAttribute('href').slice(1))];
    if (target) a.setAttribute('href', `#${target}`);
  });
}

/**
 * Fallback for "#Name" links whose named anchor was already stripped: match the heading whose
 * text equals the name once spaces/punctuation are removed (e.g. #Conventionsoflanguage), or the
 * heading the link text repeats. A name resolved once is reused for its other links.
 */
function fixUnresolvedAnchors(root) {
  const squash = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const headings = [...root.querySelectorAll(HEADINGS)];
  const resolved = {};
  const pending = [];
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const name = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!name || name === 'top') return;
    const exists = headings.some((h) => headingId(h.textContent.trim()) === name)
      || root.querySelector(`[id="${name}"], [name="${name}"]`);
    if (exists) return;
    if (resolved[name]) {
      a.setAttribute('href', `#${resolved[name]}`);
      return;
    }
    // 1) heading text equals the anchor name; 2) heading text equals or prefixes the link text
    // ("On this page" lists repeat the heading, e.g. #isrs -> "NAPLAN results for students ...")
    const linkText = squash(a.textContent);
    const heading = headings.find((h) => squash(h.textContent) === squash(name))
      || headings.find((h) => linkText && squash(h.textContent) === linkText)
      || headings
        .filter((h) => squash(h.textContent).length > 8 && linkText.startsWith(squash(h.textContent)))
        .sort((x, y) => squash(y.textContent).length - squash(x.textContent).length)[0];
    if (heading) {
      resolved[name] = headingId(heading.textContent.trim());
      a.setAttribute('href', `#${resolved[name]}`);
    } else {
      pending.push([a, name]);
    }
  });
  pending.forEach(([a, name]) => {
    if (resolved[name]) a.setAttribute('href', `#${resolved[name]}`);
  });
}

/** Keeps links to migrated pages relative; sends everything else on the source host to the live site. */
function rewriteLinks(root, baseUrl = SOURCE_ORIGIN) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const raw = a.getAttribute('href').trim();
    if (!raw) {
      // empty href (e.g. leftover anchor) is not a link
      unwrap(a);
      return;
    }
    if (raw.startsWith('#') || /^(mailto|tel|javascript):/i.test(raw)) return;
    let url;
    try { url = new URL(raw, baseUrl); } catch (e) { return; }
    if (!isSourceHost(url.hostname)) return;
    const path = sanitizePath(url.pathname);
    const isDocument = DOCUMENT_PATTERN.test(url.pathname) || url.pathname.toLowerCase().startsWith('/docs/');
    if (!isDocument && MIGRATED_PATHS.has(path)) {
      const name = url.hash ? decodeURIComponent(url.hash.slice(1)) : '';
      const alias = name && ANCHOR_ALIASES[path] && ANCHOR_ALIASES[path][name];
      a.setAttribute('href', `${path}${url.search}${alias ? `#${alias}` : url.hash}`);
    } else {
      a.setAttribute('href', `${SOURCE_ORIGIN}${url.pathname}${url.search}${url.hash}`);
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    fixNamedAnchors(element);
  }
  if (hookName === 'afterTransform') {
    const base = (payload && payload.params && payload.params.originalURL) || SOURCE_ORIGIN;
    fixUnresolvedAnchors(element);
    rewriteLinks(element, base);
  }
}
