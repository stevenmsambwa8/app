import { richTextHtml } from '../lib/richText';

// Use for post/comment/DM bodies: plain strings that may have emoji
// anywhere inside them, not just a single known glyph. Also bolds/colours
// #hashtags, numbers, links, and @mentions (see lib/richText.js).
export default function TwemojiText({ text, as: Tag = 'span', className, ...rest }) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: richTextHtml(text) }}
      {...rest}
    />
  );
}
