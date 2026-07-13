export default function Avatar({ emoji, size = 40 }) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {emoji}
    </div>
  );
}
