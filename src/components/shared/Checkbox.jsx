import React from 'react'
import PropTypes from 'prop-types'
import './Checkbox.css'

function Checkbox({checked, onChange}) {
  return (
    <>
      <label className="checkbox">
          <input className="checkbox__input" type="checkbox" checked={checked} onChange={onChange}/>
          <span className="checkbox__mark material-symbols-outlined"></span>
      </label>
    </>
  )
}

Checkbox.defaultProps = {
  checked: false,
  onChange: () => {},
}

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
}

export default Checkbox