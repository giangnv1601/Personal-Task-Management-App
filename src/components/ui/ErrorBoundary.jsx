import React from "react"
import PropTypes from "prop-types"
import { getErrorMessage, ERROR_KEYS } from "@/constants/errorMessages"


// Hiển thị fallback UI và cho phép reload hoặc copy lỗi.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ error, info })
    // Log lỗi ra console trong dev
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught:", error, info)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleCopy = async () => {
    const payload = {
      error: String(this.state.error),
      info: this.state.info,
      url: window.location.href,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      // eslint-disable-next-line no-alert
      alert("Chi tiết lỗi đã được copy vào clipboard.")
    } catch {
      // ignore
    }
  }

  render() {
    const { hasError, error } = this.state
    const { children, locale } = this.props

    if (!hasError) return children

    // Chuẩn hóa message hiển thị
    const message = error?.message || getErrorMessage(ERROR_KEYS.UNKNOWN, locale)

    return (
      <div role="alert" aria-live="assertive" className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-xl w-full bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-sm text-slate-700 mb-4">{message}</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Tải lại trang
            </button>
            <button
              type="button"
              onClick={this.handleCopy}
              className="px-4 py-2 border rounded"
            >
              Sao chép chi tiết lỗi
            </button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 text-xs text-slate-500 overflow-auto max-h-40">
              {String(error && (error.stack || error))}
            </pre>
          )}
        </div>
      </div>
    )
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  locale: PropTypes.string,
}
ErrorBoundary.defaultProps = {
  locale: "vi",
}