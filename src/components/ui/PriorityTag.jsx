import React from "react"
import { CircleAlert, AlertTriangle, CheckCircle } from "lucide-react"

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
}

const VARIANT_STYLES = {
  soft: {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-green-100 text-green-700",
  },
  solid: {
    high: "bg-red-600 text-white",
    medium: "bg-amber-600 text-white",
    low: "bg-green-600 text-white",
  },
  outline: {
    high: "border border-red-500 text-red-700",
    medium: "border border-amber-500 text-amber-700",
    low: "border border-green-500 text-green-700",
  },
}

const ICONS = {
  high: <AlertTriangle size={14} />,
  medium: <CircleAlert size={14} />,
  low: <CheckCircle size={14} />,
}

/**
 * PriorityTag
 * @param {string} priority - "high" | "medium" | "low"
 * @param {string} size - "sm" | "md" | "lg"
 * @param {string} variant - "soft" | "solid" | "outline"
 * @param {boolean} showIcon - có hiển thị icon hay không
 * @param {string} className - thêm class tùy chỉnh
 */
export default function PriorityTag({
  priority,
  size = "md",
  variant = "soft",
  showIcon = true,
  className = "",
}) {
  const value = String(priority || "").toLowerCase()

  if (!["high", "medium", "low"].includes(value)) {
    return <span className="text-gray-500">—</span>
  }

  const sizeCls = SIZE_STYLES[size] || SIZE_STYLES.md
  const variantCls = VARIANT_STYLES[variant]?.[value] || VARIANT_STYLES.soft[value]
  const icon = ICONS[value]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeCls} ${variantCls} ${className}`}
    >
      {showIcon && icon}
      {value[0].toUpperCase() + value.slice(1)}
    </span>
  )
}
