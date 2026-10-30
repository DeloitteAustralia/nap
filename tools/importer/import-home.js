/* eslint-disable */
/* global WebImporter */

import carouselSideTextParser from './parsers/carousel-side-text.js';
import cardsArticleParser from './parsers/cards-article.js';
import cardsNewsParser from './parsers/cards-news.js';
import napLinksTransformer from './transformers/nap-links.js';
import napCleanupTransformer from './transformers/nap-cleanup.js';
import napSectionsTransformer from './transformers/nap-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.nap.edu.au"
  ],
  "representativeUrl": "https://www.nap.edu.au",
  "description": "NAP homepage: banner carousel of linked promo slides with a welcome panel, three feature article cards and a What's New news list.",
  "blocks": [
    {
      "name": "carousel-side-text",
      "instances": [
        "#home-carousel",
        "section.banner .carousel"
      ]
    },
    {
      "name": "cards-article",
      "instances": [
        "#content1 .bottom-section .row:has(.divarticle)"
      ]
    },
    {
      "name": "cards-news",
      "instances": [
        "#content1 article.divNewsContent"
      ]
    }
  ],
  "urlPattern": "/",
  "sections": [
    {
      "id": "rc4",
      "name": "Home banner carousel",
      "selector": [
        "#form1 > section.banner",
        "section.banner"
      ],
      "style": "light-grey",
      "blocks": [
        "carousel-side-text"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
      "name": "Feature cards and What's New",
      "selector": [
        "#content1",
        ".bottom-section"
      ],
      "style": "split",
      "blocks": [
        "cards-article",
        "cards-news"
      ],
      "defaultContent": [
        "#content1 article.divNewsContent > h3"
      ]
    }
  ]
};

const parsers = {
  'carousel-side-text': carouselSideTextParser,
  'cards-article': cardsArticleParser,
  'cards-news': cardsNewsParser,
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
