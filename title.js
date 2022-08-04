class Note {
    constructor(name, content){
        this.name = name;
        this.content = content;
    }
    getContent(){
        return this.content;
    }
    setContent(content){
        this.content = content;
    }
    getName(){
        return this.name;
    }
    setName(name){
        this.name = name;
    }
}

class Shelf {
    constructor(){
        this.NoteList = [];
    }
    getContent(){
        return this.NoteList;
    }
    add(note){
        this.NoteList[this.NoteList.length] = note;
        return this.NoteList[this.NoteList.length - 1]
    }
    remove(note){
        this.NoteList.splice(this.NoteList.indexOf(note),1);
    }
}

function init(){
    //create a new shelf
    this.loneshelf = new Shelf();

    //associate element references
    this.vEditor = document.getElementById("editor");
    this.vList = document.getElementById("list");
    this.tClose = document.getElementById("tClose");
    this.tNew = document.getElementById("tNew");
    this.doc = document.getElementById("doc");
    this.hClose = () => {};
    this.hDelete = () => {};
    
    //add the global listener to make a new note
    this.tNew.addEventListener('click', () => {
        let freshnote = new Note();
        this.loneshelf.add(freshnote);
        EditView(freshnote);
    });

    //start the app in shelf view
    ShelfView();
}

function ShelfView(){ //transitions to list note view using the current shelf

    //Clear and re-render the note list
    this.vList.innerHTML = "";

    //show a notice if there are no notes in the shelf
    if(this.loneshelf.getContent().length == 0){
        let emptynotice = document.createElement('p');
        emptynotice.innerHTML = "No Notes, click 'New Note' to add one!";
        this.vList.appendChild(emptynotice);
    }

    //add the notes from the shelf to the list
    this.loneshelf.getContent().forEach((note) => {
        link = document.createElement("a");
        link.innerHTML = (note.getName() == "" ? "Untitled Note" : note.getName());
        link.href = "#";
        link.addEventListener('click', (e) => {
            this.EditView(note);
        })
        this.vList.appendChild(link);
        this.vList.appendChild(document.createElement('br'));
    });

    //Alter the visibility of UI elements
    this.tNew.disabled = false;
    this.tDelete.style.display = "none";
    this.vList.style.display = "block";
    this.tClose.style.display = "none";
    this.vEditor.style.display = "none";
}

function EditView(note){ //transitions to editing view with a given note ref

    //avoid 'undefined' in new or empty notes
    this.vEditor.children[0].value = (note.getName() == undefined ? "" : note.getName());
    this.vEditor.children[1].value = (note.getContent() == undefined ? "" : note.getContent());

    this.tClose.removeEventListener('click', this.hClose);
    this.tDelete.removeEventListener('click', this.hDelete);

    this.hClose = () => {
        if(this.vEditor.children[1].value == "" && this.vEditor.children[0].value == ""){
            this.loneshelf.remove(note);
        } else {
            note.setName(this.vEditor.children[0].value);
            note.setContent(this.vEditor.children[1].value);
        }
        this.vEditor.children[0].value = "";
        this.vEditor.children[1].value = "";
        ShelfView();
    }

    this.hDelete = () => {
        this.loneshelf.remove(note);
        this.vEditor.children[0].value = "";
        this.vEditor.children[1].value = "";
        ShelfView();
    }

    //Add a one-time save function to the current close button
    this.tClose.addEventListener('click', hClose, {once : true});

    this.tDelete.addEventListener('click', hDelete, {once : true});

    //Alter the visibility of UI elements
    this.tNew.disabled = true;
    this.tDelete.style.display = "block";
    this.vList.style.display = "none";
    this.tClose.style.display = "block";
    this.vEditor.style.display = "block";
}
