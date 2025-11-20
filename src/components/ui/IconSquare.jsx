import React from "react"
import PropTypes from "prop-types"

const IconSquare = ({ size = 48 }) => {
  return (
    <div
      className="rounded-md bg-[#5E7280] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-sm bg-white flex items-center justify-center"
        style={{ width: size / 2, height: size / 2 }}
      />
    </div>
  )
}

export default IconSquare

IconSquare.propTypes = {
  size: PropTypes.number,
}
IconSquare.defaultProps = {
  size: 48,
}