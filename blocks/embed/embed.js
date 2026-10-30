/*
 * Embed block (YouTube video)
 * Authored content: one cell with the video URL (link), per the EDS embed convention.
 * The player loads when the block nears the viewport; until then the link stays usable.
 */

function youtubeId(url) {
  if (url.hostname === 'youtu.be') return url.pathname.slice(1);
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(url.hostname)) return null;
  if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
  return url.searchParams.get('v');
}

function buildPlayer(url, title) {
  const id = youtubeId(url);
  const iframe = document.createElement('iframe');
  if (id) {
    const src = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    url.searchParams.forEach((value, key) => { if (key !== 'v') src.searchParams.set(key, value); });
    iframe.src = src.href;
    iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
  } else {
    iframe.src = url.href;
  }
  iframe.title = title || 'Embedded video';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  return iframe;
}

/**
 * Player title: the link text when it isn't the bare URL; otherwise the paragraph that
 * introduces the video ("Watch our video on ... | transcript:"); otherwise a generic title.
 */
function playerTitle(block, link) {
  const text = link.textContent.trim();
  if (text && text !== link.href && !/^https?:\/\//.test(text)) return text;
  const wrapper = block.parentElement;
  const previous = wrapper && wrapper.previousElementSibling;
  const intro = previous && [...previous.querySelectorAll('p')].pop();
  const introText = intro ? intro.textContent.replace(/\s+/g, ' ').trim() : '';
  if (introText.endsWith(':')) return introText.split('|')[0].replace(/[:\s]+$/, '').trim();
  return 'YouTube video';
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  if (!link) return;
  const url = new URL(link.href);
  const title = playerTitle(block, link);

  const frame = document.createElement('div');
  frame.className = 'embed-frame';
  frame.append(link);
  block.replaceChildren(frame);

  const load = () => frame.replaceChildren(buildPlayer(url, title));
  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
