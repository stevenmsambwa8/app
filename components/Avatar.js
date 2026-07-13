export default function Avatar({ emoji, size = 40, ring = false }) {
  const el = (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {emoji}
    </div>
  );

  if (!ring) return el;

  return <div className="ring">{el}</div>;
}
