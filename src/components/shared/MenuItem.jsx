import React from 'react'

function MenuItem({ children, style }) {

    const styles = {
        global: {display: 'flex', paddingBlock: '.1rem', backgroundColor: '#d5d5d5'},
            heading: {marginInline: '1rem', display: 'flex', alignItems: 'center'},
            content: {},
            title: {marginTop: '.5rem', marginBottom: '.5rem', fontSize: '20px'},
            body: {marginBottom: '.5rem',},
    }

  return (
    <li style={{...styles.global, ...style}}>
        <div style={styles.heading}>{children[0]}</div>
        <div style={styles.content}>
            <h2 style={styles.title}>{children[1]}</h2>
            <div style={styles.body}>{children[2]}</div>
        </div>
    </li>
  )
}

export default MenuItem