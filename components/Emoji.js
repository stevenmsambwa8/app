import { twemojiUrl } from '../lib/twemoji';

// Renders one emoji as a Twemoji image instead of the native glyph.
// Sizes itself to the surrounding text by default (1em) so it drops
// into existing layouts without extra styling.
export default function Emoji({ emoji, size = '1em', className = '', style = {} }) {
  if (!emoji) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={twemojiUrl(emoji)}
      alt={emoji}
      draggable={false}
      className={`twemoji-inline ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: '-0.15em',
        ...style,
      }}
    />
  );
}
