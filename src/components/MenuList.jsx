import React from 'react'
import '../styles/MenuList.css'

function MenuList({ children }) {

    return (
        <div className="root">
            {children}
        </div>
    )
}

export default MenuList