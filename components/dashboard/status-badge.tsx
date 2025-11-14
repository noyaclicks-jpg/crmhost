import { Badge } from "@/components/ui/badge"

type StatusType = "active" | "pending" | "error" | "disabled" | "healthy"

interface StatusBadgeProps {
  status: StatusType
  label?: string
}

const statusConfig = {
  active: {
    label: "Active",
    symbol: "✓",
    className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300",
  },
  pending: {
    label: "Pending",
    symbol: "○",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300",
  },
  error: {
    label: "Error",
    symbol: "✕",
    className: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300",
  },
  disabled: {
    label: "Disabled",
    symbol: "!",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  healthy: {
    label: "Healthy",
    symbol: "✓",
    className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300",
  },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="secondary" className={config.className}>
      <span className="mr-1">{config.symbol}</span>
      {label || config.label}
    </Badge>
  )
}
