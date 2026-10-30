/* eslint-disable */
/* global WebImporter */

/**
 * NAP (www.nap.edu.au, Sitefinity / ASP.NET) cleanup transformer.
 * Removes non-authorable page chrome and ASP.NET/Sitefinity artifacts.
 */

// Decorative line images. Live pages use the original NAPImages URLs; the
// captured cleaned.html uses the locally-mapped hashed filenames.
const DECORATIVE_IMAGES = [
  'img[src*="NAPImages/banner-background-lines"]',
  'img[src*="NAPImages/generic-lines"]',
  'img[src*="3233966f0d5cfbd4fd9022fd1635b05c"]',
  'img[src*="4353ea3b36d2acb6c6a028f05b0f73b5"]',
];

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

function unwrap(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  el.remove();
}

function isBlank(el) {
  return el.textContent.replace(/ /g, ' ').trim() === ''
    && !el.querySelector('img, picture, video, iframe, table, hr, br');
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Some pages (e.g. /resources) author a banner image inside the breadcrumb bar:
    // keep it by moving it to the top of the article before the bar is removed.
    const article = element.querySelector('.main-content-text');
    if (article) {
      [...element.querySelectorAll('.breadcrumbandpageshare .sfimageWrp img')].reverse().forEach((img) => {
        const p = element.ownerDocument.createElement('p');
        p.append(img);
        article.prepend(p);
      });
    }

    // Page chrome: logo strip, header, footer, ASP.NET hidden fields, breadcrumb/share bar.
    removeAll(element, [
      '.logo-header',
      'section.navigation-top',
      '#footer1',
      'div.aspNetHidden',
      '.breadcrumbandpageshare',
      'input[type="hidden"]',
      'input',
      'script',
      'style',
      'noscript',
      'link',
      'iframe[src*="googletagmanager"]',
    ]);

    removeAll(element, DECORATIVE_IMAGES);

    // Empty banner placeholder on pages without a hero.
    element.querySelectorAll('div.top-section').forEach((el) => {
      if (isBlank(el)) el.remove();
    });

    // Duplicate article h1 when the hero carries the page title.
    if (element.querySelector('.hero-section .hero-page-title h1')) {
      element.querySelectorAll('.main-content-text h1').forEach((h1) => h1.remove());
    }

    // Back-to-top links and named "top" anchors.
    element.querySelectorAll('a').forEach((a) => {
      const href = (a.getAttribute('href') || '').trim();
      const text = a.textContent.replace(/ /g, ' ').trim().toLowerCase();
      if (href === '#top' && (text === 'top' || text === '')) {
        a.remove();
        return;
      }
      if (!href && (a.getAttribute('name') === 'top' || (text === '' && !a.querySelector('img')))) {
        a.remove();
      }
    });

    // Paragraphs left empty (e.g. <p>&nbsp;</p> or after removing "top" links).
    element.querySelectorAll('p').forEach((p) => {
      if (isBlank(p)) p.remove();
    });
  }

  if (hookName === 'afterTransform') {
    // Unwrap Sitefinity content-block wrappers.
    element.querySelectorAll('.sfContentBlock').forEach(unwrap);

    // Headings left empty (source used blank <h2>&nbsp;</h2> as anchor holders).
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      if (isBlank(h)) h.remove();
    });

    // Strip ASP.NET / Sitefinity generated IDs and tracking attributes.
    element.querySelectorAll('[id]').forEach((el) => {
      const id = el.getAttribute('id');
      if (/^(ctl\d|ContentPlaceHolder|BannerImageContentPlaceHolder|[0-9a-f]{8}-[0-9a-f]{4}-)/i.test(id)
        || /_C\d{3}_|ClientState$/.test(id)) {
        el.removeAttribute('id');
      }
    });
    element.querySelectorAll('[onclick], [data-sf-ec-immutable], [data-sf-field], [data-sf-ftype]').forEach((el) => {
      ['onclick', 'data-sf-ec-immutable', 'data-sf-field', 'data-sf-ftype'].forEach((a) => el.removeAttribute(a));
    });

    // Final pass for any remaining empty paragraphs.
    element.querySelectorAll('p').forEach((p) => {
      if (isBlank(p)) p.remove();
    });
  }
}
