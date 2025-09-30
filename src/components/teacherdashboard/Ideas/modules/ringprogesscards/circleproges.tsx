export default function TeacherRingIdeas({
  size = 56,
  stroke = 6,
  percent = 0,
  text,
  color = "var(--primary)",
}: {
  size?: number
  stroke?: number
  percent: number // 0–100
  text: string
  color?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (percent / 100) * c

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--neutral-300)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="14"
        fill="var(--neutral-1000)"
        style={{ fontWeight: 400 }}
      >
        {text}
      </text>
    </svg>
  )
}
