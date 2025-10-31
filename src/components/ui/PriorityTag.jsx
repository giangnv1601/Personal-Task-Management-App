import React from "react"

export default function PriorityTag({ priority }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
  const val = String(priority || "").toLowerCase()
  if (val === "high") return <span className={`${base} bg-red-100 text-red-700`}>High</span>
  if (val === "medium") return <span className={`${base} bg-amber-100 text-amber-700`}>Medium</span>
  if (val === "low") return <span className={`${base} bg-green-100 text-green-700`}>Low</span>
  return <span className="text-gray-500">—</span>
}


