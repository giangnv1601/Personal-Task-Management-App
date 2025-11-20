import React from "react"
import PropTypes from "prop-types"
import { PRIORITY_LABEL } from "@/constants/task"

const MAP = {
  high: "bg-red-500 text-white",
  medium: "bg-orange-500 text-white",
  low: "bg-slate-400 text-white",
}

export default function PriorityBadge({ value }) {
  const key = String(value || "").toLowerCase()
  const label = PRIORITY_LABEL[key] || "—"
  const cls = MAP[key] || "bg-slate-200 text-slate-700"
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-sm ${cls}`} aria-label={label === "—" ? "Không có ưu tiên" : `Ưu tiên: ${label}`}>
      {label === "—" ? "—" : label}
    </span>
  )
}

PriorityBadge.propTypes = {
  value: PropTypes.string,
}
PriorityBadge.defaultProps = {
  value: "",
}