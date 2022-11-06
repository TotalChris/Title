import logo from './logo.svg';
import './App.css';
import Notecard from './components/Notecard';
import MenuList from './components/MenuList';
import Notes from './data/NoteData';
import MenuItem from './components/shared/MenuItem';

function App() {
  return (
    <div className="App">
      <MenuList id="noteList">
        {Notes.map((note) => {
          return <Notecard key={note.id} note={note}></Notecard>
        })}
      </MenuList>
    </div>
  );
}

export default App;
