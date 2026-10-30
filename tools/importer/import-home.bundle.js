/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/carousel-side-text.js
  function cleanCaption(container) {
    container.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
    container.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    [...container.querySelectorAll("br")].forEach((br) => {
      if (br.parentElement === container) br.remove();
    });
    [...container.querySelectorAll("div, p")].reverse().forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector("img, picture, a")) el.remove();
    });
    return [...container.childNodes].filter((n) => n.nodeType === 1 || n.nodeType === 3 && n.textContent.trim());
  }
  function parse(element, { document }) {
    const inner = element.querySelector(".carousel-inner") || element;
    const items = [...inner.children].filter((c) => c.classList.contains("item"));
    const cells = [];
    items.forEach((item) => {
      let imageCell = "";
      const img = [...item.querySelectorAll("img")].find((i) => !i.closest(".carousel-caption"));
      if (img) {
        img.removeAttribute("style");
        img.removeAttribute("data-displaymode");
        const link = img.closest("a");
        if (link && item.contains(link) && link.getAttribute("href")) {
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.append(img);
          imageCell = a;
        } else {
          imageCell = img;
        }
      }
      let textCell = "";
      const caption = item.querySelector(".carousel-caption");
      if (caption) {
        const content = caption.querySelector(".sfContentBlock") || caption;
        const nodes = cleanCaption(content);
        if (nodes.length) textCell = nodes;
      }
      if (imageCell || textCell) cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-side-text", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function isBlank(node) {
    return node && (node.nodeType === 3 && !node.textContent.trim() || node.nodeName === "BR");
  }
  function splitReadMore(content, document) {
    [...content.querySelectorAll("p a")].forEach((a) => {
      if (!/read more/i.test(a.textContent)) return;
      const p = a.closest("p");
      const np = document.createElement("p");
      np.append(a);
      p.after(np);
      while (isBlank(p.lastChild)) p.lastChild.remove();
      const last = p.lastElementChild;
      if (last && last.nodeName === "STRONG") {
        while (isBlank(last.lastChild)) last.lastChild.remove();
      }
      if (!p.textContent.trim() && !p.querySelector("img")) p.remove();
    });
  }
  function parse2(element, { document }) {
    const articles = [...element.querySelectorAll(".divarticle article")];
    if (!articles.length) return;
    const columns = [...element.children].filter((col) => col.querySelector(".divarticle"));
    const cells = [];
    articles.forEach((art) => {
      let imageCell = "";
      const img = art.querySelector(".divArticleImage img");
      if (img) {
        img.removeAttribute("id");
        img.removeAttribute("style");
        imageCell = img;
      }
      let textCell = "";
      const wrap = art.querySelector(".divArticleContent");
      if (wrap) {
        const content = wrap.querySelector(".sfContentBlock") || wrap;
        content.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
        splitReadMore(content, document);
        const nodes = [...content.children].filter((el) => el.textContent.trim() || el.querySelector("img"));
        if (nodes.length) textCell = nodes;
      }
      if (imageCell || textCell) cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
    const anchor = columns[0] || articles[0].closest(".divarticle");
    anchor.before(block);
    if (columns.length) {
      columns.forEach((col) => col.remove());
    } else {
      articles.forEach((art) => (art.closest(".divarticle") || art).remove());
    }
  }

  // tools/importer/parsers/cards-news.js
  function parse3(element, { document }) {
    const heading = element.querySelector(":scope > h3");
    if (heading) {
      heading.textContent = heading.textContent.trim();
      element.before(heading);
    }
    const items = [...element.querySelectorAll(".whatsnew")];
    const cells = [];
    items.forEach((item) => {
      const content = [];
      const link = item.querySelector("a[href]");
      const titleEl = item.querySelector("h1, h2, h3, h4, h5, h6");
      const titleText = (titleEl && titleEl.textContent || link && link.getAttribute("title") || "").trim();
      if (titleText) {
        const h4 = document.createElement("h4");
        h4.textContent = titleText;
        content.push(h4);
      }
      const dateEl = item.querySelector("strong, b");
      const dateText = dateEl ? dateEl.textContent.trim() : "";
      if (dateText) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = dateText;
        p.append(strong);
        content.push(p);
      }
      [...item.querySelectorAll("p")].forEach((p) => {
        if (!p.textContent.trim() || p.contains(dateEl) || link && p.contains(link)) return;
        p.removeAttribute("style");
        content.push(p);
      });
      if (link) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        if (link.getAttribute("title")) a.title = link.getAttribute("title");
        a.textContent = link.textContent.trim() || "read more";
        const p = document.createElement("p");
        p.append(a);
        content.push(p);
      }
      if (content.length) cells.push([content]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/nap-links.js
  var SOURCE_ORIGIN = "https://www.nap.edu.au";
  var MIGRATED_PATHS = /* @__PURE__ */ new Set([
    "/",
    "/about",
    "/nap-sample-assessments",
    "/naplan",
    "/naplan/faqs",
    "/naplan/faqs/naplan-results-reports-performance",
    "/naplan/for-parents-carers",
    "/naplan/for-schools",
    "/naplan/key-dates",
    "/naplan/public-demonstration-site",
    "/naplan/results-and-reports",
    "/naplan/whats-in-the-tests",
    "/resources",
    "/results-and-reports"
  ]);
  var ANCHOR_ALIASES = {
    "/naplan/results-and-reports": {
      national: "naplan-national-results",
      schools: "naplan-results-for-schools",
      isrs: "naplan-results-for-students-parents-and-carers-individual-student-reports",
      "proficiency-scales-standards": "naplan-scales-and-proficiency-standards",
      scalesdiagram: "diagram-naplan-measurement-scales-averaged-across-domains",
      cutpointstable: "table-naplan-scale-score-cut-points-between-proficiency-levels",
      2026: "naplan-2026-results",
      techreports: "naplan-technical-reports"
    },
    "/naplan/whats-in-the-tests": {
      NAPLANAC: "naplan-aligned-with-the-australian-curriculum",
      Writing: "writing",
      Reading: "reading",
      Conventionsoflanguage: "conventions-of-language",
      Numeracy: "numeracy",
      PastNAPLANtestpapers: "past-naplan-test-papers"
    }
  };
  var DOCUMENT_PATTERN = /\.(pdf|docx?|xlsx?|pptx?|zip|csv|rtf)$/i;
  var HEADINGS = "h1, h2, h3, h4, h5, h6";
  function sanitizePath(pathname) {
    const path = pathname.split("/").map((segment) => {
      let s = segment;
      try {
        s = decodeURIComponent(segment);
      } catch (e) {
      }
      return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }).join("/").replace(/\/+$/, "");
    if (!path || path === "/home") return "/";
    return path;
  }
  function headingId(text) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
  }
  function isSourceHost(hostname) {
    return hostname === "nap.edu.au" || hostname === "www.nap.edu.au";
  }
  function unwrap(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    el.remove();
  }
  function fixNamedAnchors(root) {
    const headings = [...root.querySelectorAll(HEADINGS)];
    const map = {};
    root.querySelectorAll("a[name]:not([href])").forEach((a) => {
      const name = a.getAttribute("name");
      if (name === "top") return;
      const heading = a.closest(HEADINGS) || headings.find((h) => a.compareDocumentPosition(h) & 4);
      if (heading && heading.textContent.trim()) map[name] = headingId(heading.textContent.trim());
      if (a.textContent.trim() || a.querySelector("img")) unwrap(a);
      else a.remove();
    });
    root.querySelectorAll('a[href^="#"]').forEach((a) => {
      const target = map[decodeURIComponent(a.getAttribute("href").slice(1))];
      if (target) a.setAttribute("href", `#${target}`);
    });
  }
  function fixUnresolvedAnchors(root) {
    const squash = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const headings = [...root.querySelectorAll(HEADINGS)];
    const resolved = {};
    const pending = [];
    root.querySelectorAll('a[href^="#"]').forEach((a) => {
      const name = decodeURIComponent(a.getAttribute("href").slice(1));
      if (!name || name === "top") return;
      const exists = headings.some((h) => headingId(h.textContent.trim()) === name) || root.querySelector(`[id="${name}"], [name="${name}"]`);
      if (exists) return;
      if (resolved[name]) {
        a.setAttribute("href", `#${resolved[name]}`);
        return;
      }
      const linkText = squash(a.textContent);
      const heading = headings.find((h) => squash(h.textContent) === squash(name)) || headings.find((h) => linkText && squash(h.textContent) === linkText) || headings.filter((h) => squash(h.textContent).length > 8 && linkText.startsWith(squash(h.textContent))).sort((x, y) => squash(y.textContent).length - squash(x.textContent).length)[0];
      if (heading) {
        resolved[name] = headingId(heading.textContent.trim());
        a.setAttribute("href", `#${resolved[name]}`);
      } else {
        pending.push([a, name]);
      }
    });
    pending.forEach(([a, name]) => {
      if (resolved[name]) a.setAttribute("href", `#${resolved[name]}`);
    });
  }
  function rewriteLinks(root, baseUrl = SOURCE_ORIGIN) {
    root.querySelectorAll("a[href]").forEach((a) => {
      const raw = a.getAttribute("href").trim();
      if (!raw) {
        unwrap(a);
        return;
      }
      if (raw.startsWith("#") || /^(mailto|tel|javascript):/i.test(raw)) return;
      let url;
      try {
        url = new URL(raw, baseUrl);
      } catch (e) {
        return;
      }
      if (!isSourceHost(url.hostname)) return;
      const path = sanitizePath(url.pathname);
      const isDocument = DOCUMENT_PATTERN.test(url.pathname) || url.pathname.toLowerCase().startsWith("/docs/");
      if (!isDocument && MIGRATED_PATHS.has(path)) {
        const name = url.hash ? decodeURIComponent(url.hash.slice(1)) : "";
        const alias = name && ANCHOR_ALIASES[path] && ANCHOR_ALIASES[path][name];
        a.setAttribute("href", `${path}${url.search}${alias ? `#${alias}` : url.hash}`);
      } else {
        a.setAttribute("href", `${SOURCE_ORIGIN}${url.pathname}${url.search}${url.hash}`);
      }
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      fixNamedAnchors(element);
    }
    if (hookName === "afterTransform") {
      const base = payload && payload.params && payload.params.originalURL || SOURCE_ORIGIN;
      fixUnresolvedAnchors(element);
      rewriteLinks(element, base);
    }
  }

  // tools/importer/transformers/nap-cleanup.js
  var DECORATIVE_IMAGES = [
    'img[src*="NAPImages/banner-background-lines"]',
    'img[src*="NAPImages/generic-lines"]',
    'img[src*="3233966f0d5cfbd4fd9022fd1635b05c"]',
    'img[src*="4353ea3b36d2acb6c6a028f05b0f73b5"]'
  ];
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function unwrap2(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    el.remove();
  }
  function isBlank2(el) {
    return el.textContent.replace(/ /g, " ").trim() === "" && !el.querySelector("img, picture, video, iframe, table, hr, br");
  }
  function transform2(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      const article = element.querySelector(".main-content-text");
      if (article) {
        [...element.querySelectorAll(".breadcrumbandpageshare .sfimageWrp img")].reverse().forEach((img) => {
          const p = element.ownerDocument.createElement("p");
          p.append(img);
          article.prepend(p);
        });
      }
      removeAll(element, [
        ".logo-header",
        "section.navigation-top",
        "#footer1",
        "div.aspNetHidden",
        ".breadcrumbandpageshare",
        'input[type="hidden"]',
        "input",
        "script",
        "style",
        "noscript",
        "link",
        'iframe[src*="googletagmanager"]'
      ]);
      removeAll(element, DECORATIVE_IMAGES);
      element.querySelectorAll("div.top-section").forEach((el) => {
        if (isBlank2(el)) el.remove();
      });
      if (element.querySelector(".hero-section .hero-page-title h1")) {
        element.querySelectorAll(".main-content-text h1").forEach((h1) => h1.remove());
      }
      element.querySelectorAll("a").forEach((a) => {
        const href = (a.getAttribute("href") || "").trim();
        const text = a.textContent.replace(/ /g, " ").trim().toLowerCase();
        if (href === "#top" && (text === "top" || text === "")) {
          a.remove();
          return;
        }
        if (!href && (a.getAttribute("name") === "top" || text === "" && !a.querySelector("img"))) {
          a.remove();
        }
      });
      element.querySelectorAll("p").forEach((p) => {
        if (isBlank2(p)) p.remove();
      });
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(".sfContentBlock").forEach(unwrap2);
      element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
        if (isBlank2(h)) h.remove();
      });
      element.querySelectorAll("[id]").forEach((el) => {
        const id = el.getAttribute("id");
        if (/^(ctl\d|ContentPlaceHolder|BannerImageContentPlaceHolder|[0-9a-f]{8}-[0-9a-f]{4}-)/i.test(id) || /_C\d{3}_|ClientState$/.test(id)) {
          el.removeAttribute("id");
        }
      });
      element.querySelectorAll("[onclick], [data-sf-ec-immutable], [data-sf-field], [data-sf-ftype]").forEach((el) => {
        ["onclick", "data-sf-ec-immutable", "data-sf-field", "data-sf-ftype"].forEach((a) => el.removeAttribute(a));
      });
      element.querySelectorAll("p").forEach((p) => {
        if (isBlank2(p)) p.remove();
      });
    }
  }

  // tools/importer/transformers/nap-sections.js
  var MARKER = "data-excat-section-id";
  function findSection(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function hasContent(el) {
    return !!el && (el.textContent.replace(/ /g, " ").trim() !== "" || !!el.querySelector("img, picture, video, table"));
  }
  function getSections(payload) {
    return payload && payload.template && payload.template.sections || [];
  }
  function transform3(hookName, element, payload) {
    const sections = getSections(payload);
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const present = sections.map((section) => ({ section, el: findSection(element, section) })).filter(({ el }) => hasContent(el));
      for (let i = present.length - 1; i >= 0; i -= 1) {
        const { section, el } = present[i];
        const isFirst = i === 0;
        if (isFirst && !section.style) continue;
        const hr = document.createElement("hr");
        hr.setAttribute(MARKER, section.id);
        if (isFirst) hr.setAttribute("data-excat-first", "true");
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      const markers = [...element.querySelectorAll(`hr[${MARKER}]`)];
      for (let i = markers.length - 1; i >= 0; i -= 1) {
        const hr = markers[i];
        const id = hr.getAttribute(MARKER);
        const section = sections.find((s) => s.id === id);
        const isFirst = hr.hasAttribute("data-excat-first");
        if (section && section.style) {
          let anchor = hr;
          let next = hr.nextElementSibling;
          while (next && next.tagName !== "HR") {
            anchor = next;
            next = next.nextElementSibling;
          }
          const meta = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
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

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "carousel-side-text": parse,
    "cards-article": parse2,
    "cards-news": parse3
  };
  var transformers = [transform, transform2, transform3];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      const claimed = [];
      blockDef.instances.forEach((selector) => {
        let matches = [];
        try {
          matches = [...document.querySelectorAll(selector)];
        } catch (e) {
          console.error(`Invalid selector for ${blockDef.name}: ${selector}`, e);
        }
        matches.forEach((element) => {
          if (claimed.some((c) => c === element || c.contains(element) || element.contains(c))) return;
          claimed.push(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
