import { twemojiHtml } from './twemoji'

// Recognised TLDs for the "bare domain" case (shop.com, duka.co.tz, ...).
// Kept as a whitelist rather than a generic "anything.anything" match so
// normal Swahili sentences with abbreviations/periods don't get treated
// as links.
const TLDS = 'com|co\\.tz|org|net|io|co|app|dev|tz|ke|ug|info|biz';

// Single pass over the raw text: whichever alternative matches first at a
// given position wins, so a full https:// URL is always claimed before the
// bare-domain pattern gets a chance at it, and a #hashtag or @mention is
// never re-matched by the plain-number pattern.
const RICH_RE = new RegExp(
  '(https?://[^\\s<]+)' + // 1: full URL
  '|(www\\.[^\\s<]+)' + // 2: www.something
  `|(\\b(?=[a-zA-Z0-9-]*[a-zA-Z])[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\.(?:${TLDS})(?:/[^\\s<]*)?)` + // 3: bare domain
  '|(@[a-zA-Z0-9_]{2,30})' + // 4: mention
  '|(#[a-zA-Z0-9_]{2,30})' + // 5: hashtag
  '|(\\b\\d[\\d,]*(?:\\.\\d+)?%?\\b)', // 6: number
  'g'
);

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Turns plain post text into safe HTML for dangerouslySetInnerHTML:
// - #hashtags and numbers are bolded
// - https://, www., and bare domains (shop.com) are bolded + made clickable
// - @mentions are bolded + linked to /u/<username>
// - emoji are converted to twemoji images (same as before)
// classNames lets each caller pass in its own CSS-module class names, e.g.
// richTextHtml(text, { link: styles.richLink, mention: styles.richMention })
export function richTextHtml(text, classNames = {}) {
  const cls = {
    link: classNames.link || '',
    mention: classNames.mention || '',
    hashtag: classNames.hashtag || '',
    number: classNames.number || '',
  };

  const escaped = escapeHtml(text);
  let out = '';
  let lastIndex = 0;

  for (const m of escaped.matchAll(RICH_RE)) {
    const [full, url, www, domain, mention, hashtag, number] = m;
    out += escaped.slice(lastIndex, m.index);

    if (url) {
      out += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${cls.link}">${url}</a>`;
    } else if (www) {
      out += `<a href="https://${www}" target="_blank" rel="noopener noreferrer" class="${cls.link}">${www}</a>`;
    } else if (domain) {
      out += `<a href="https://${domain}" target="_blank" rel="noopener noreferrer" class="${cls.link}">${domain}</a>`;
    } else if (mention) {
      out += `<a href="/u/${mention.slice(1)}" class="${cls.mention}">${mention}</a>`;
    } else if (hashtag) {
      out += `<strong class="${cls.hashtag}">${hashtag}</strong>`;
    } else if (number) {
      out += `<strong class="${cls.number}">${number}</strong>`;
    }

    lastIndex = m.index + full.length;
  }
  out += escaped.slice(lastIndex);

  // Emoji conversion runs last — twemoji only touches emoji code points so
  // it can't interfere with the tags/attributes we just built above.
  return twemojiHtml(out);
}
