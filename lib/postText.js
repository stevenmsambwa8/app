// Feeling/activity tags aren't a real DB column — they're encoded as a
// trailing marker on the post's text so no migration is needed. These
// helpers keep that encoding in one place so every screen that renders
// post text shows the feeling as its own small badge instead of it being
// swallowed into the (often large/bold) post-text styling.
const FEELING_RE = /\n\n\[FEELING:([^|\]]+)\|([^\]]+)\]$/;

export function encodeFeeling(text, feeling) {
  if (!feeling) return text;
  return `${text}\n\n[FEELING:${feeling.emoji}|${feeling.label}]`;
}

// Returns { text, feeling } — text with the marker stripped out, and
// feeling as { emoji, label } or null if the post has none.
export function parsePostText(raw) {
  const text = raw || '';
  const m = text.match(FEELING_RE);
  if (!m) return { text, feeling: null };
  return { text: text.slice(0, m.index), feeling: { emoji: m[1], label: m[2] } };
}
