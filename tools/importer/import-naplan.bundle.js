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

  // tools/importer/import-naplan.js
  var import_naplan_exports = {};
  __export(import_naplan_exports, {
    default: () => import_naplan_default
  });

  // tools/importer/parsers/hero-title-panel.js
  function parse(element, { document }) {
    const root = element.querySelector(".containerherosection") || element;
    const cells = [];
    const img = root.querySelector(".hero-image img") || [...root.querySelectorAll("img")].find((i) => !i.closest(".hero-page-title"));
    if (img) {
      const image = document.createElement("img");
      image.src = img.getAttribute("src");
      image.alt = img.getAttribute("alt") || "";
      cells.push([image]);
    } else {
      cells.push([""]);
    }
    const titleSrc = root.querySelector(".hero-page-title h1") || root.querySelector("h1");
    const titleText = titleSrc ? titleSrc.textContent.replace(/\s+/g, " ").trim() : "";
    if (titleText) {
      const h1 = document.createElement("h1");
      h1.textContent = titleText;
      cells.push([h1]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-title-panel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-side-nav.js
  function parse2(element, { document }) {
    const list = element.matches("ul") ? element : element.querySelector("#ULSideNavMenu") || element.querySelector("ul");
    const cloneLink = (a) => {
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.replace(/\s+/g, " ").trim();
      return link;
    };
    const cells = [];
    const items = list ? [...list.children].filter((c) => c.tagName === "LI") : [];
    items.forEach((li) => {
      const a = [...li.children].find((c) => c.tagName === "A" && c.getAttribute("href"));
      if (!a || !a.textContent.trim()) return;
      const content = [cloneLink(a)];
      const subList = [...li.children].find((c) => c.tagName === "UL" || c.tagName === "OL");
      if (subList) {
        const ul = document.createElement("ul");
        [...subList.children].filter((c) => c.tagName === "LI").forEach((subLi) => {
          const subA = subLi.querySelector("a[href]");
          if (!subA || !subA.textContent.trim()) return;
          const newLi = document.createElement("li");
          newLi.append(cloneLink(subA));
          ul.append(newLi);
        });
        if (ul.children.length) content.push(ul);
      }
      cells.push([content]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-side-nav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-indented.js
  function parse3(element, { document }) {
    const p = document.createElement("p");
    p.innerHTML = element.innerHTML;
    p.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    const cells = [[p]];
    const block = WebImporter.Blocks.createBlock(document, { name: "quote-indented", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse4(element, { document }) {
    const cells = [];
    const panels = [...element.querySelectorAll(".panel")].filter((panel) => panel.closest(".panel-group") === element);
    panels.forEach((panel) => {
      const titleEl = panel.querySelector(".panel-title a") || panel.querySelector(".panel-title");
      let question = "";
      if (titleEl) {
        const clone = titleEl.cloneNode(true);
        clone.querySelectorAll(".glyphicon").forEach((s) => s.remove());
        question = clone.textContent.replace(/\s+/g, " ").trim();
      }
      if (!question) return;
      const body = panel.querySelector(".panel-body");
      const answer = body ? [...body.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim()) : [];
      cells.push([question, answer.length ? answer : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-dates.js
  function parse5(element, { document }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) return;
    table.querySelectorAll(".k-table-resize-handle-wrapper, .k-column-resize-handle-wrapper, .k-row-resize-handle-wrapper").forEach((el) => el.remove());
    const ownRows = (section) => section ? [...section.children].filter((r) => r.tagName === "TR") : [];
    const thead = [...table.children].find((c) => c.tagName === "THEAD");
    const headRows = ownRows(thead);
    const bodySections = [...table.children].filter((c) => c.tagName === "TBODY");
    const bodyRows = bodySections.length ? bodySections.flatMap(ownRows) : ownRows(table);
    const cleanHeader = (td) => {
      const text = td.textContent.replace(/\s+/g, " ").trim();
      if (!text) return "";
      const strong = document.createElement("strong");
      strong.textContent = text;
      return strong;
    };
    const cleanData = (td) => {
      td.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
      const nodes = [...td.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
      return nodes.length ? nodes : "";
    };
    const buildGrid = (rows, mapper) => {
      const grid = [];
      rows.forEach((tr, r) => {
        grid[r] = grid[r] || [];
        let c = 0;
        [...tr.children].filter((td) => td.tagName === "TD" || td.tagName === "TH").forEach((td) => {
          while (grid[r][c] !== void 0) c += 1;
          const rs = Math.max(1, parseInt(td.getAttribute("rowspan") || "1", 10) || 1);
          const cs = Math.max(1, parseInt(td.getAttribute("colspan") || "1", 10) || 1);
          for (let i = 0; i < rs && r + i < rows.length; i += 1) {
            grid[r + i] = grid[r + i] || [];
            for (let j = 0; j < cs; j += 1) {
              grid[r + i][c + j] = i === 0 && j === 0 ? mapper(td) : "";
            }
          }
          c += cs;
        });
      });
      return grid;
    };
    const all = [...buildGrid(headRows, cleanHeader), ...buildGrid(bodyRows, cleanData)];
    const width = all.reduce((m, row) => Math.max(m, row.length), 0);
    const cells = all.map((row) => {
      const full = [];
      for (let i = 0; i < width; i += 1) full.push(row[i] === void 0 ? "" : row[i]);
      return full;
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-dates", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse6(element, { document }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) return;
    table.querySelectorAll(".k-table-resize-handle-wrapper, .k-column-resize-handle-wrapper, .k-row-resize-handle-wrapper").forEach((el) => el.remove());
    const sections = [...table.children].filter((c) => c.tagName === "TBODY");
    const rows = (sections.length ? sections : [table]).flatMap((s) => [...s.children].filter((r) => r.tagName === "TR"));
    const rowCells = rows.map((tr) => [...tr.children].filter((td) => td.tagName === "TD" || td.tagName === "TH").map((td) => {
      td.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
      const nodes = [...td.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
      return nodes.length ? nodes : "";
    })).filter((r) => r.some((c) => c !== ""));
    const width = rowCells.reduce((m, r) => Math.max(m, r.length), 0);
    const cells = rowCells.map((r) => {
      const full = [...r];
      while (full.length < width) full.push("");
      return full;
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
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
    "/naplan/whats-in-the-tests",
    "/resources",
    "/results-and-reports"
  ]);
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
    root.querySelectorAll('a[href^="#"]').forEach((a) => {
      const name = decodeURIComponent(a.getAttribute("href").slice(1));
      if (!name || name === "top") return;
      const exists = headings.some((h) => headingId(h.textContent.trim()) === name) || root.querySelector(`[id="${name}"], [name="${name}"]`);
      if (exists) return;
      const heading = headings.find((h) => squash(h.textContent) === squash(name));
      if (heading) a.setAttribute("href", `#${headingId(heading.textContent.trim())}`);
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
        a.setAttribute("href", `${path}${url.search}${url.hash}`);
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
  function isBlank(el) {
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
        if (isBlank(el)) el.remove();
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
        if (isBlank(p)) p.remove();
      });
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(".sfContentBlock").forEach(unwrap2);
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
        if (isBlank(p)) p.remove();
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

  // tools/importer/import-naplan.js
  var PAGE_TEMPLATE = {
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
          '.main-content-text p[style*="margin-left"]'
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
  var parsers = {
    "hero-title-panel": parse,
    "cards-side-nav": parse2,
    "quote-indented": parse3,
    "accordion-faq": parse4,
    "table-dates": parse5,
    "columns": parse6
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
  var import_naplan_default = {
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
  return __toCommonJS(import_naplan_exports);
})();
