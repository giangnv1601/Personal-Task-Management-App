import React from "react"
import { STATUS_LABEL } from "@/constants/task"

const MAP = {
  todo: "bg-slate-200 text-slate-800",
  in_progress: "bg-yellow-300 text-yellow-900",
  done: "bg-green-200 text-green-800",
}

export default function StatusBadge({ value }) {
  const key = String(value || "").toLowerCase()
  const label = STATUS_LABEL[key] || "Chưa làm"
  const cls = MAP[key] || "bg-slate-200 text-slate-800"
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-sm ${cls}`} aria-label={`Trạng thái: ${label}`}>
      {label}
    </span>
  )
}