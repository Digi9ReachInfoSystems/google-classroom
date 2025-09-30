type ProgressCircleProps = {
  percent: number
  size?: number
  strokeWidth?: number
  trackColor?: string
  progressColor?: string
  centerLabel?: string
  className?: string
}

export default function ProgressCircle({
  percent,
  size = 72,
  strokeWidth = 6,
  trackColor = "var(--neutral-300)",
  progressColor = "var(--primary)",
  centerLabel,
  className,
}: ProgressCircleProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={progressColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {centerLabel ? (
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={Math.max(12, Math.floor(size * 0.2))}
          fill="var(--neutral-1000)"
          style={{ fontWeight: 500 }}
        >
          {centerLabel}
        </text>
      ) : null}
    </svg>
  )
}


