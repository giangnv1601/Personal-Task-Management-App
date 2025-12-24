import { CircleAlert, AlertTriangle, CheckCircle } from "lucide-react"
import PropTypes from "prop-types"
import React from "react"

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
  size = "md", // sm | md | lg
  variant = "subtle", // subtle | solid | outline
  showIcon = true,
  className = "",
}) {
  const value = String(priority || "").toLowerCase()

  if (!["high", "medium", "low"].includes(value)) {
    return <span className="text-gray-500">—</span>
  }

  const sz = SIZE_STYLES[size] || SIZE_STYLES.md
  const sty = VARIANT_STYLES[variant]?.[value] || VARIANT_STYLES.soft[value]
  const label = value[0].toUpperCase() + value.slice(1)

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-medium ${sz} ${sty} ${className}`}
      aria-label={label === "—" ? "Không có ưu tiên" : `Ưu tiên: ${label}`}
    >
      {showIcon && (ICONS[value] || null)}
      <span>{label}</span>
    </span>
  )
}

PriorityTag.propTypes = {
  priority: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  variant: PropTypes.oneOf(["subtle", "solid", "outline"]),
  showIcon: PropTypes.bool,
  className: PropTypes.string,
}
PriorityTag.defaultProps = {
  priority: "",
  size: "md",
  variant: "subtle",
  showIcon: true,
  className: "",
}
