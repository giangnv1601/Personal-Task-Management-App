import { X } from "lucide-react"
import PropTypes from "prop-types"
import React from "react"

export default function ConfirmDialog({
  open,
  title = "Xác nhận",
  message = "Bạn có chắc muốn tiếp tục?",
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="presentation">
      <div
        className="bg-white rounded-xl shadow-lg w-[360px] p-5 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex justify-between items-center mb-3">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold">{title}</h2>
          <button onClick={onCancel} aria-label="Đóng" className="text-gray-500 hover:text-gray-700">
            <X size={20} aria-hidden="true" focusable="false" />
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-5" role="alert" aria-live="polite">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border bg-gray-100 hover:bg-gray-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            aria-label={confirmText}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
}

ConfirmDialog.defaultProps = {
  title: "Xác nhận",
  message: "Bạn có chắc muốn tiếp tục?",
  confirmText: "Đồng ý",
  cancelText: "Hủy",
  onConfirm: () => {},
  onCancel: () => {},
}
