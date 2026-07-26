import { twemojiHtml } from './twemoji'

// Recognised TLDs for the "bare domain" case (shop.com, duka.co.tz, ...).
// Kept as a whitelist rather than a generic "anything.anything" match so
// normal Swahili sentences with abbreviations/periods don't get treated
// as links.
const TLDS = 'com|co\\.tz|org|net|io|co|app|dev|tz|ke|ug|info|biz';

// Phone numbers only — not arbitrary numbers (prices, counts, etc. are left
// alone). Matches Tanzanian mobile formats: +255 followed by 9 digits
// (12 digits total), or a local 10-digit number starting 07 or 06.
// Lookaround on both ends makes sure it's exactly that many digits, not a
// slice of some longer number.
const PHONE_RE_SRC = '(?<!\\d)(?:\\+255\\d{9}|0[67]\\d{8})(?!\\d)';

// Single pass over the raw text: whichever alternative matches first at a
// given position wins, so a full https:// URL is always claimed before the
// bare-domain pattern gets a chance at it, and a #hashtag or @mention is
// never re-matched by the phone-number pattern.
const RICH_RE = new RegExp(
  '(https?://[^\\s<]+)' + // 1: full URL
  '|(www\\.[^\\s<]+)' + // 2: www.something
  `|(\\b(?=[a-zA-Z0-9-]*[a-zA-Z])[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\.(?:${TLDS})(?:/[^\\s<]*)?)` + // 3: bare domain
  '|(@[a-zA-Z0-9_]{2,30})' + // 4: mention
  '|(#[a-zA-Z0-9_]{2,30})' + // 5: hashtag
  `|(${PHONE_RE_SRC})`, // 6: phone number
  'g'
);

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Turns plain post text into safe HTML for dangerouslySetInnerHTML:
// - #hashtags are bolded + coloured
// - https://, www., and bare domains (shop.com) are bolded + coloured + made clickable
// - @mentions are bolded + coloured + linked to /u/<username>
// - phone numbers (+255..., 07..., 06...) are bolded + coloured + made tel: clickable
// - emoji are converted to twemoji images (same as before)
// Always uses the global .rich-link / .rich-mention / .rich-hashtag /
// .rich-phone classes (defined in globals.css) so every screen that
// renders post/comment/DM text — feed, post detail, DMs, previews — looks
// the same without every caller having to wire up its own CSS classes.
export function richTextHtml(text) {
  const escaped = escapeHtml(text);
  let out = '';
  let lastIndex = 0;

  for (const m of escaped.matchAll(RICH_RE)) {
    const [full, url, www, domain, mention, hashtag, phone] = m;
    out += escaped.slice(lastIndex, m.index);

    if (url) {
      out += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="rich-link">${url}</a>`;
    } else if (www) {
      out += `<a href="https://${www}" target="_blank" rel="noopener noreferrer" class="rich-link">${www}</a>`;
    } else if (domain) {
      out += `<a href="https://${domain}" target="_blank" rel="noopener noreferrer" class="rich-link">${domain}</a>`;
    } else if (mention) {
      out += `<a href="/u/${mention.slice(1)}" class="rich-mention">${mention}</a>`;
    } else if (hashtag) {
      out += `<strong class="rich-hashtag">${hashtag}</strong>`;
    } else if (phone) {
      out += `<a href="tel:${phone}" class="rich-phone">${phone}</a>`;
    }

    lastIndex = m.index + full.length;
  }
  out += escaped.slice(lastIndex);

  // Emoji conversion runs last — twemoji only touches emoji code points so
  // it can't interfere with the tags/attributes we just built above.
  return twemojiHtml(out);
}
