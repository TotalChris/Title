import React, { Children } from 'react'
import '../styles/MenuList.css'
import Checkbox from './shared/Checkbox'
import MenuItem from './shared/MenuItem'

function MenuList({ children }) {

    return (
        <div className="root">
           {children}
        </div>
    )
}

export default MenuList