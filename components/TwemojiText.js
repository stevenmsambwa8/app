import { twemojiHtml } from '../lib/twemoji';

// Use for post/comment/DM bodies: plain strings that may have emoji
// anywhere inside them, not just a single known glyph.
export default function TwemojiText({ text, as: Tag = 'span', className, ...rest }) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: twemojiHtml(text) }}
      {...rest}
    />
  );
}
