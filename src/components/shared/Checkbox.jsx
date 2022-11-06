import React from 'react'
import './Checkbox.css'

function Checkbox({style, checked, onChange}) {
  return (
    <label className="checkbox">
        <input className="checkbox__input" type="checkbox" checked={checked} style={style} onChange={onChange}/>
        <span className="checkbox__mark material-symbols-outlined"></span>
    </label>
  )
}

export default Checkbox