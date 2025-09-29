"use client";

interface ProgressCircleProps {
  status: "completed" | "due" | "pending"
  label: string
  size?: number
}

export function ProgressCircle({ status, label, size = 80 }: ProgressCircleProps) {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "stroke-primary"
      case "due":
        return "stroke-neutral-300"
      case "pending":
        return "stroke-neutral-300"
      default:
        return "stroke-neutral-300"
    }
  }

  const getStatusIcon = () => {
    if (status === "completed") {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-neutral-800">Completed</span>
        </div>
      )
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-neutral-600 capitalize">{status}</span>
      </div>
    )
  }

  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = status === "completed" ? circumference : 0

  return (
    <div className="flex items-center space-x-3">
      <div className="relative progress-circle" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="stroke-neutral-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDasharray}
            className={getStatusColor()}
            style={{
              transition: "stroke-dashoffset 0.5s ease-in-out",
            }}
          />
        </svg>
        {getStatusIcon()}
      </div>
      <span className="text-sm font-medium text-neutral-800">{label}</span>
    </div>
  )
}
