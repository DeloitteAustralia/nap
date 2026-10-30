/* eslint-disable */
/* global WebImporter */

/**
 * NAP sections transformer.
 * Template "naplan": rc4 hero banner (no style) + rc5 side-nav/main content (style "split").
 * If the hero is absent or empty, the page is a single "split" section.
 */

const MARKER = 'data-excat-section-id';

function findSection(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    let el = null;
    try { el = root.querySelector(sel); } catch (e) { el = null; }
    if (el) return el;
  }
  return null;
}

function hasContent(el) {
  return !!el && (el.textContent.replace(/ /g, ' ').trim() !== ''
    || !!el.querySelector('img, picture, video, table'));
}

function getSections(payload) {
  return (payload && payload.template && payload.template.sections) || [];
}

export default function transform(hookName, element, payload) {
  const sections = getSections(payload);
  if (sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // Resolve present, non-empty sections in document order.
    const present = sections
      .map((section) => ({ section, el: findSection(element, section) }))
      .filter(({ el }) => hasContent(el));

    for (let i = present.length - 1; i >= 0; i -= 1) {
      const { section, el } = present[i];
      const isFirst = i === 0;
      if (isFirst && !section.style) continue;
      const hr = document.createElement('hr');
      hr.setAttribute(MARKER, section.id);
      if (isFirst) hr.setAttribute('data-excat-first', 'true');
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    const markers = [...element.querySelectorAll(`hr[${MARKER}]`)];
    for (let i = markers.length - 1; i >= 0; i -= 1) {
      const hr = markers[i];
      const id = hr.getAttribute(MARKER);
      const section = sections.find((s) => s.id === id);
      const isFirst = hr.hasAttribute('data-excat-first');

      if (section && section.style) {
        // Place Section Metadata at the end of the section (before next break).
        let anchor = hr;
        let next = hr.nextElementSibling;
        while (next && next.tagName !== 'HR') {
          anchor = next;
          next = next.nextElementSibling;
        }
        const meta = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        anchor.after(meta);
      }

      if (isFirst) {
        hr.remove();
      } else {
        hr.removeAttribute(MARKER);
      }
    }
  }
}
