import Emoji from './Emoji';

export default function Avatar({ emoji, src, size = 40, ring = false, alt = '' }) {
  const el = (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      ) : (
        <Emoji emoji={emoji} size={size * 0.55} style={{ verticalAlign: 'baseline' }} />
      )}
    </div>
  );

  if (!ring) return el;

  return <div className="ring">{el}</div>;
}
