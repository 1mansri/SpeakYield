/**
 * A week of closes as a bare line. No axes, no grid, no tooltip — at this size those
 * would be decoration. The farmer reads one thing off it: which way the crop has been
 * moving, which is exactly what the number beside it can't tell them.
 */
export default function Sparkline({
  values,
  color,
  width = 52,
  height = 20,
}: {
  values: number[];
  /** A CSS colour — callers pass the same up/down colour as the delta beside it. */
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return <span className="inline-block" style={{ width, height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat week is a real outcome, not a divide-by-zero — draw it as a level line.
  const span = max - min || 1;
  const padding = 2;
  const usable = height - padding * 2;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = padding + (1 - (value - min) / span) * usable;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const [lastX, lastY] = points[points.length - 1].split(",").map(Number);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="overflow-visible"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The head of the line — where the price stands today. */}
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
}
