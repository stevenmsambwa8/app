'use client'
import Avatar from './Avatar'
import Emoji from './Emoji'
import UserBadge from './UserBadge'
import { richTextHtml } from '../lib/richText'
import cardStyles from './PostCard.module.css'
import styles from './PostPreview.module.css'

function isImageUrl(src) {
  return typeof src === 'string' && /^(https?:\/\/|\/)/.test(src);
}

function isTemplateImage(src) {
  return typeof src === 'string' && src.startsWith('/post-templates/');
}

function formatPrice(price) {
  return `TZS ${Number(price).toLocaleString('sw-TZ')}`;
}

// A read-only stand-in for PostCard used on the create-post page so the
// person can see exactly how their post will render — same media overlay,
// same header, same mutually-exclusive price/CTA pill — before they tap
// "Chapisha". Nothing here is clickable/interactive on purpose.
export default function PostPreview({ author, text, feeling, tag, images = [], cta, price }) {
  const hasImages = images.length > 0;
  const priceNum = price !== '' && price != null ? Number(price) : null;
  const hasPrice = priceNum != null && !Number.isNaN(priceNum) && priceNum > 0;
  const hasCta = !hasPrice && !!cta && !!cta.label;
  const isColorOnly = hasImages && images.length === 1 && (!isImageUrl(images[0]) || isTemplateImage(images[0]));
  const displayText = text && text.trim() ? text : 'Andika kitu leo...';

  const headerBlock = (
    <div className={cardStyles.header}>
      <div className={cardStyles.who}>
        <Avatar emoji={author?.avatar} src={author?.avatarUrl} alt={author?.name} />
        <div>
          <div className={cardStyles.nameRow}>
            <span className={cardStyles.name}>{author?.name || 'Wewe'}</span>
            <UserBadge badge={author?.badge} iconOnly={author?.badge === 'business'} />
          </div>
          <span className={cardStyles.meta}>Sasa hivi · {tag}</span>
        </div>
      </div>
    </div>
  );

  const priceOrCtaPill = hasCta || hasPrice ? (
    <div className={cardStyles.ctaOverlayInline}>
      <span className={cardStyles.ctaOverlay}>
        {hasPrice ? (
          <>
            <i className="ri-shopping-cart-2-line" />
            <span className={cardStyles.ctaLabel}>{formatPrice(priceNum)}</span>
          </>
        ) : (
          <>
            <i className={cta.icon || 'ri-arrow-right-line'} />
            <span className={cardStyles.ctaLabel}>{cta.label}</span>
          </>
        )}
      </span>
    </div>
  ) : null;

  const actionsBlock = (
    <div className={cardStyles.actions}>
      <div className={cardStyles.actionsLeft}>
        <span className={cardStyles.action}>
          <i className="ri-heart-line" /> 0
        </span>
        <span className={cardStyles.action}>
          <i className="ri-chat-3-line" /> 0
        </span>
      </div>
      {priceOrCtaPill}
      <span className={`${cardStyles.action} ${cardStyles.spacer}`}>
        <i className="ri-share-line" />
      </span>
    </div>
  );

  const topLeftRow = (
    <div className={cardStyles.topLeftRow}>
      <span className={cardStyles.mediaTag}>{tag}</span>
      {feeling && (
        <span className={cardStyles.feelingBadge}>
          <Emoji emoji={feeling.emoji} /> feeling {feeling.label}
        </span>
      )}
    </div>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>
        <i className="ri-eye-line" />
        Muonekano wa Chapisho
      </div>
      <div className={`card ${cardStyles.card} ${styles.card}`}>
        {hasImages ? (
          <div className={cardStyles.mediaWrap}>
            {isImageUrl(images[0]) ? (
              <div className={cardStyles.media}>
                {topLeftRow}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[0]} alt="" className={cardStyles.mediaImg} />
                {isTemplateImage(images[0]) && (
                  <p className={cardStyles.mediaText}>{displayText}</p>
                )}
              </div>
            ) : (
              <div className={`${cardStyles.media} texture`} style={{ background: images[0] }}>
                {topLeftRow}
                <p className={cardStyles.mediaText}>{displayText}</p>
              </div>
            )}
            {images.length > 1 && (
              <span className={cardStyles.count}>1/{images.length}</span>
            )}
            <div className={`${cardStyles.body} ${cardStyles.bodyOverlay}`}>
              {headerBlock}
              {!isColorOnly && (
                <div className={cardStyles.textWrap}>
                  <p
                    className={cardStyles.text}
                    dangerouslySetInnerHTML={{
                      __html: richTextHtml(displayText, {
                        link: cardStyles.richLink,
                        mention: cardStyles.richMention,
                        hashtag: cardStyles.richHashtag,
                        number: cardStyles.richNumber,
                      }),
                    }}
                  />
                </div>
              )}
              {actionsBlock}
            </div>
          </div>
        ) : (
          <div className={cardStyles.body}>
            {headerBlock}
            {actionsBlock}
            {feeling && (
              <span className={cardStyles.feelingChip}>
                <Emoji emoji={feeling.emoji} /> feeling {feeling.label}
              </span>
            )}
            {tag && <span className={cardStyles.bodyTag}>{tag}</span>}
            <div className={cardStyles.textWrap}>
              <p
                className={cardStyles.text}
                dangerouslySetInnerHTML={{
                  __html: richTextHtml(displayText, {
                    link: cardStyles.richLink,
                    mention: cardStyles.richMention,
                    hashtag: cardStyles.richHashtag,
                    number: cardStyles.richNumber,
                  }),
                }}
              />
            </div>
            {hasCta && (
              <span className={`btnAccent ${cardStyles.cta}`}>
                <i className={cta.icon || 'ri-arrow-right-line'} />
                <span className={cardStyles.ctaLabel}>{cta.label}</span>
              </span>
            )}
            {hasPrice && (
              <div className={cardStyles.cartBlockRow}>
                <span className={styles.priceBtn}>
                  <i className="ri-shopping-cart-2-line" />
                  {formatPrice(priceNum)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
