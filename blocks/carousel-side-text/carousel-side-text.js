import { createOptimizedPicture } from '../../scripts/aem.js';

const ROTATE_DELAY = 6000;
let carouselCount = 0;

function optimizeImages(container) {
  container.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const picture = img.closest('picture');
    picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1600' }, { width: '900' }]));
  });
}

/**
 * Some authoring sources emit a linked image as a picture followed by a
 * separate link paragraph. Wrap the picture in that link so the image stays clickable.
 */
function linkImage(cell) {
  const picture = cell.querySelector('picture');
  if (!picture || picture.closest('a')) return;
  const link = [...cell.querySelectorAll('a[href]')].find((a) => {
    const p = a.closest('p');
    return p && p.textContent.trim() === a.textContent.trim();
  });
  if (!link) return;
  const p = link.closest('p');
  const wrapper = document.createElement('a');
  wrapper.href = link.href;
  if (link.title) wrapper.title = link.title;
  const pictureParent = picture.parentElement;
  picture.replaceWith(wrapper);
  wrapper.append(picture);
  p.remove();
  if (pictureParent && pictureParent.tagName === 'P' && !pictureParent.textContent.trim() && !pictureParent.querySelector('a, picture')) {
    pictureParent.remove();
  }
}

function buildSlide(row, index, total, id) {
  // slides are divs: role=group is not allowed on list items
  const slide = document.createElement('div');
  slide.className = 'carousel-side-text-slide';
  slide.id = `${id}-slide-${index + 1}`;
  slide.dataset.slideIndex = index;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture'));
  const textCells = cells.filter(
    (c) => c !== imageCell && (c.textContent.trim() || c.children.length),
  );

  if (imageCell) {
    linkImage(imageCell);
    imageCell.className = 'carousel-side-text-slide-image';
    // text authored in the image cell (besides the image) moves to the text panel
    const strays = [...imageCell.children].filter((el) => !el.querySelector('picture') && el.tagName !== 'PICTURE');
    if (strays.length) {
      const extra = document.createElement('div');
      extra.append(...strays);
      textCells.unshift(extra);
    }
    slide.append(imageCell);
  } else {
    slide.classList.add('no-image');
  }

  if (textCells.length) {
    const content = document.createElement('div');
    content.className = 'carousel-side-text-slide-content';
    textCells.forEach((c) => content.append(...c.childNodes));
    slide.append(content);
  } else {
    slide.classList.add('no-content');
  }

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  const img = slide.querySelector('img');
  let label = `${index + 1} of ${total}`;
  if (heading && heading.textContent.trim()) label += `: ${heading.textContent.trim()}`;
  else if (img && img.alt) label += `: ${img.alt}`;
  slide.setAttribute('aria-label', label);

  return slide;
}

export default function decorate(block) {
  carouselCount += 1;
  const id = `carousel-side-text-${carouselCount}`;
  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture, img'));

  const slidesList = document.createElement('div');
  slidesList.className = 'carousel-side-text-slides';
  slidesList.id = `${id}-slides`;
  const slides = rows.map((row, i) => buildSlide(row, i, rows.length, id));
  slidesList.append(...slides);
  optimizeImages(slidesList);

  block.id = id;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  if (!block.hasAttribute('aria-label')) block.setAttribute('aria-label', 'Featured content');

  const container = document.createElement('div');
  container.className = 'carousel-side-text-slides-container';
  container.append(slidesList);
  block.replaceChildren(container);

  if (slides.length === 0) return;

  if (slides.length < 2) {
    block.classList.add('single-slide');
    slides[0].classList.add('active');
    return;
  }

  let current = 0;
  let timer = null;
  let userPaused = false;
  let hoverOrFocus = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const controls = document.createElement('div');
  controls.className = 'carousel-side-text-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-side-text-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.setAttribute('aria-controls', slidesList.id);

  const indicators = document.createElement('ol');
  indicators.className = 'carousel-side-text-indicators';
  indicators.setAttribute('aria-label', 'Choose slide');
  const dots = slides.map((slide, i) => {
    const li = document.createElement('li');
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-side-text-indicator';
    dot.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    dot.setAttribute('aria-controls', slide.id);
    li.append(dot);
    indicators.append(li);
    return dot;
  });

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-side-text-next';
  next.setAttribute('aria-label', 'Next slide');
  next.setAttribute('aria-controls', slidesList.id);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'carousel-side-text-toggle';

  controls.append(prev, indicators, next, toggle);
  container.append(controls);

  function isRotating() {
    return timer !== null;
  }

  function updateToggle() {
    const rotating = !userPaused && !reducedMotion.matches;
    toggle.setAttribute('aria-label', rotating ? 'Stop automatic slide show' : 'Start automatic slide show');
    toggle.classList.toggle('paused', !rotating);
    // with reduced motion the slides never rotate, so the toggle has no purpose
    toggle.hidden = reducedMotion.matches;
    // announce slide changes only when the user drives them
    slidesList.setAttribute('aria-live', isRotating() ? 'off' : 'polite');
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if (active) slide.removeAttribute('inert');
      else slide.setAttribute('inert', '');
    });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    block.dataset.activeSlide = current;
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
    updateToggle();
  }

  function start() {
    stop();
    if (userPaused || hoverOrFocus || reducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => show(current + 1), ROTATE_DELAY);
    updateToggle();
  }

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) stop();
    else start();
  });

  block.addEventListener('keydown', (e) => {
    if (e.target.closest('.carousel-side-text-controls') === null) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });

  block.addEventListener('mouseenter', () => { hoverOrFocus = true; stop(); });
  block.addEventListener('mouseleave', () => { hoverOrFocus = block.contains(document.activeElement); start(); });
  block.addEventListener('focusin', () => { hoverOrFocus = true; stop(); });
  block.addEventListener('focusout', (e) => {
    if (block.contains(e.relatedTarget)) return;
    hoverOrFocus = block.matches(':hover');
    start();
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reducedMotion.addEventListener('change', () => (reducedMotion.matches ? stop() : start()));

  show(0);
  start();
}
