import twemoji from 'twemoji';

// twemoji's original maxcdn/twitter CDN is gone; jdecked/twemoji (the
// maintained fork) publishes the same assets via jsDelivr.
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/';

// Single-emoji -> image URL, for spots rendering one glyph (avatars,
// feeling badges, picker buttons).
export function twemojiUrl(emoji, folder = '72x72', ext = '.png') {
  const codepoint = twemoji.convert.toCodePoint(emoji);
  return `${TWEMOJI_BASE}${folder}/${codepoint}${ext}`;
}

// Free-form text that may contain emoji mixed with words (post bodies,
// comments, DMs). Returns HTML with each emoji swapped for an <img>,
// meant for dangerouslySetInnerHTML.
export function twemojiHtml(text, className = 'twemoji-inline') {
  return twemoji.parse(text || '', {
    base: TWEMOJI_BASE,
    folder: '72x72',
    ext: '.png',
    className,
  });
}
