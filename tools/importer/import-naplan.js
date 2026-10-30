/* eslint-disable */
/* global WebImporter */

import heroTitlePanelParser from './parsers/hero-title-panel.js';
import cardsSideNavParser from './parsers/cards-side-nav.js';
import quoteIndentedParser from './parsers/quote-indented.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import tableDatesParser from './parsers/table-dates.js';
import columnsParser from './parsers/columns.js';
import napLinksTransformer from './transformers/nap-links.js';
import napCleanupTransformer from './transformers/nap-cleanup.js';
import napSectionsTransformer from './transformers/nap-sections.js';

const PAGE_TEMPLATE = {
  "name": "naplan",
  "urls": [
    "https://www.nap.edu.au/about",
    "https://www.nap.edu.au/nap-sample-assessments",
    "https://www.nap.edu.au/naplan",
    "https://www.nap.edu.au/naplan/faqs",
    "https://www.nap.edu.au/naplan/faqs/naplan--results-reports-performance",
    "https://www.nap.edu.au/naplan/for-parents-carers",
    "https://www.nap.edu.au/naplan/for-schools",
    "https://www.nap.edu.au/naplan/key-dates",
    "https://www.nap.edu.au/naplan/public-demonstration-site",
    "https://www.nap.edu.au/naplan/whats-in-the-tests",
    "https://www.nap.edu.au/resources",
    "https://www.nap.edu.au/results-and-reports"
  ],
  "representativeUrl": "https://www.nap.edu.au/about",
  "description": "NAP content pages: optional photo hero banner, left side-navigation list and long-form article (headings, lists, images, quotes, tables, FAQ accordions).",
  "blocks": [
    {
      "name": "hero-title-panel",
      "instances": [
        ".hero-section .containerherosection",
        ".hero-section"
      ]
    },
    {
      "name": "cards-side-nav",
      "instances": [
        ".side-nav #ULSideNavMenu",
        "#ULSideNavMenu"
      ]
    },
    {
      "name": "quote-indented",
      "instances": [
        ".main-content-text p[style*=\"margin-left\"]"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        ".main-content-text .accordion .panel-group",
        ".main-content-text .panel-group"
      ]
    },
    {
      "name": "table-dates",
      "instances": [
        ".main-content-text table.k-table:has(thead)",
        ".main-content-text table:has(thead)"
      ]
    },
    {
      "name": "columns",
      "instances": [
        ".main-content-text table.k-table:not(:has(thead))"
      ]
    }
  ],
  "urlPattern": "/*",
  "sections": [
    {
      "id": "rc4",
      "name": "Hero banner",
      "selector": [
        "#form1 > div.hero-section",
        "#form1 > div.top-section",
        ".hero-section",
        ".top-section"
      ],
      "style": null,
      "blocks": [
        "hero-title-panel"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
      "name": "Sidebar navigation and main content",
      "selector": [
        "#content1",
        ".middle-section"
      ],
      "style": "split",
      "blocks": [
        "cards-side-nav",
        "quote-indented",
        "accordion-faq",
        "table-dates",
        "columns"
      ],
      "defaultContent": [
        ".main-content-text"
      ]
    }
  ]
};

const parsers = {
  'hero-title-panel': heroTitlePanelParser,
  'cards-side-nav': cardsSideNavParser,
  'quote-indented': quoteIndentedParser,
  'accordion-faq': accordionFaqParser,
  'table-dates': tableDatesParser,
  'columns': columnsParser,
};

// links first: it needs the source's named anchors, which nap-cleanup removes
const transformers = [napLinksTransformer, napCleanupTransformer, napSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    const claimed = [];
    blockDef.instances.forEach((selector) => {
      let matches = [];
      try { matches = [...document.querySelectorAll(selector)]; }
      catch (e) { console.error(`Invalid selector for ${blockDef.name}: ${selector}`, e); }
      matches.forEach((element) => {
        // instance selectors are alternate shapes of the same block: skip nested/duplicate matches
        if (claimed.some((c) => c === element || c.contains(element) || element.contains(c))) return;
        claimed.push(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
