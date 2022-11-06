import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Checkbox from './shared/Checkbox';

function Notecard({ note }) {

  const [completed, setCompleted] = useState(note.completed);
  const [name, setName] = useState(note.name);
  const [content, setContent] = useState(note.content);

  const hStatus = (e) => {setCompleted(e.target.checked)}
  const hTitle = (e) => {setName(e.target.innerHTML)}

  const styles = {
    global: {display: 'flex', paddingBlock: '.3rem', backgroundColor: '#d5d5d5'},
      heading: {marginInline: '1rem', display: 'flex', alignItems: 'center'},
      content: {},
        title: {marginBlock: '0px', fontSize: '20px', textDecoration: (completed ? 'line-through' : 'none'), opacity: (completed ? '0.6' : '1')},
        body: {},
  }

  return (
    <>
    <li style={styles.global}>
      <div style={styles.heading}>
        <Checkbox checked={completed} onChange={hStatus}></Checkbox>
      </div>
      <div style={styles.content}>
        <h2 style={styles.title} placeholder="Untitled" onBlur={hTitle}>{name}</h2>
        <div style={styles.body}>{content}</div>
      </div>
    </li>
    </>
  )
}

Notecard.propTypes = {
  note: PropTypes.object.isRequired,
}

export default Notecard