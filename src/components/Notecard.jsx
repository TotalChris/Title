import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Checkbox from './shared/Checkbox';
import MenuList from './MenuList';
import MenuItem from './shared/MenuItem';

function Notecard({ note }) {

  const [completed, setCompleted] = useState(note.completed);
  const [name, setName] = useState(note.name);
  const [content, setContent] = useState(note.content);

  const hStatus = (e) => {setCompleted(e.target.checked)}
  const hTitle = (e) => {setName(e.target.innerHTML)}

  const styles = {
    global: {display: 'flex', paddingBcoglock: '.3rem', backgroundColor: '#d5d5d5'},
      heading: {marginInline: '1rem', display: 'flex', alignItems: 'center'},
      content: {},
        title: {marginBlock: '0px', fontSize: '20px', textDecoration: (completed ? 'line-through' : 'none'), opacity: (completed ? '0.6' : '1')},
        body: {},
  }

  return (
    <>
    <MenuItem style={styles.global}>
        <Checkbox checked={completed} onChange={hStatus}></Checkbox>
        <h2 style={styles.title} placeholder="Untitled" onBlur={hTitle}>{name}</h2>
        <div style={styles.body}>{content}</div>
    </MenuItem>
    </>
  )
}

Notecard.propTypes = {
  note: PropTypes.object.isRequired,
}

export default Notecard