class Note { //definition of a note, a two-component document with a title and content
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

class Shelf { //definition of a shelf, an array collection of notes.
    constructor(){
        this.NoteList = [];
        this.name = ""
        this.uuid = crypto.randomUUID();
    }
    getContent(){
        return this.NoteList;
    }
    add(note){
        //add and return the note at the last position in the array
        this.NoteList[this.NoteList.length] = note;
        return this.NoteList[this.NoteList.length - 1]
    }
    getName(){
        return this.name;
    }
    setName(name){
        this.name = name;
    }
    getUUID(){
        return this.uuid;
    }
    setUUID(uuid){
        this.uuid = uuid;
    }
}

function init(){ //initialize element references and global objects/listeners
    //create a new shelf and shelflist (THIS WOULD IMPORT DATA IN MVP)

    

    this.shelflist = []    
    this.stored = JSON.parse(window.localStorage.getItem('TitleStoredShelves'));
    if(this.stored == null || this.stored == []){
        this.loneshelf = new Shelf();
        this.loneshelf.setName("Reminders");
        this.shelflist[0] = this.loneshelf;
    } else {
        this.stored.forEach((l) => {
            this.shelflist[this.shelflist.length] = l;
        })
    }
    

    //associate element references
    this.tShelfNameValue = document.getElementById("tShelfNameValue");
    this.dShelfName = document.getElementById("dShelfName");
    this.tShelfList = document.getElementById("shelflist");
    this.tNewShelf = document.getElementById('tNewShelf');
    this.vEditor = document.getElementById("editor");
    this.vList = document.getElementById("list");
    this.tClose = document.getElementById("tClose");
    this.tNewNote = document.getElementById("tNewNote");
    this.doc = document.getElementById("doc");
    this.hClose = () => {};
    this.hDelete = () => {};
    
    window.addEventListener('beforeunload', () => {
        window.localStorage.setItem("TitleStoredShelves", JSON.stringify(this.shelflist))
    })

    //add the global listener to make a new note
    this.tNewNote.addEventListener('click', () => {
        let freshnote = new Note();
        currentShelf.NoteList[currentShelf.NoteList.length] = freshnote;
        EditView(freshnote);
    });

    //add a global event listener to the shelf switcher
    this.tShelfList.addEventListener('change', (e) => {

        //strict match the click value with the new shelf tool value to determine if "New shelf" was clicked
        if(e.target.value == this.tNewShelf.value){
            this.dShelfName.addEventListener('close', () => { //add an event listener to the popup for closing
                let freshshelf = new Shelf();
                freshshelf.setName(this.tShelfNameValue.value);
                this.tShelfNameValue.value = ""; //clear the input
                this.shelflist[this.shelflist.length] = freshshelf; //add shelf to the list
                ShelfView(freshshelf); //update and select
            })
            this.dShelfName.showModal();

        } else {
            ShelfView(this.shelflist.find((s) => { return s.uuid == e.target.value})); //find the shelf by uuid and select/render it
        }
    })

    //start the app in shelf view with the default shelf we added
    ShelfView(this.shelflist[0]);
}

function UpdateShelves(shelftoset){ //re-renders the shelf dialog and selects the desired shelf object in the list

    this.tShelfList.innerHTML = "" //clear it

    this.shelflist.forEach((s) => {
        o = document.createElement('option');
        o.value = s.uuid;
        o.id = s.uuid;
        o.innerHTML = s.name;
        this.tShelfList.appendChild(o);
    })

    this.tShelfList.appendChild(this.tNewShelf); //add the newshelf entry
    document.getElementById(shelftoset.uuid).selected = true;
    this.currentShelf = shelftoset; //update global currentshelf
}

function ShelfView(shelf){ //transitions to list note view using the current shelf
    UpdateShelves(shelf);
    //Clear and re-render the note list
    this.vList.innerHTML = "";

    //show a notice if there are no notes in the shelf
    if(shelf.NoteList.length == 0){
        let emptynotice = document.createElement('p');
        emptynotice.innerHTML = "No Notes, click 'New Note' to add one!";
        this.vList.appendChild(emptynotice);
    }

    //add the notes from the shelf to the list
    shelf.NoteList.forEach((note) => {
        link = document.createElement("a");
        link.innerHTML = (note.name == "" ? "Untitled Note" : note.name);
        link.href = "#";
        link.addEventListener('click', (e) => {
            this.EditView(note);
        })
        this.vList.appendChild(link);
        this.vList.appendChild(document.createElement('br'));
    });

    //Alter the visibility of UI elements
    this.tShelfList.disabled = false;
    this.tNewNote.disabled = false;
    this.tDelete.style.display = "none";
    this.vList.style.display = "block";
    this.tClose.style.display = "none";
    this.vEditor.style.display = "none";
}

function EditView(note){ //transitions to editing view with a given note ref

    //avoid 'undefined' in new or empty notes
    this.vEditor.children[0].value = (note.name == undefined ? "" : note.name);
    this.vEditor.children[1].value = (note.content == undefined ? "" : note.content);

    //remove old event listeners from tool buttons to prevent cross-deletion
    this.tClose.removeEventListener('click', this.hClose);
    this.tDelete.removeEventListener('click', this.hDelete);

    //define closing a note
    this.hClose = () => {
        if(this.vEditor.children[1].value == "" && this.vEditor.children[0].value == ""){
            currentShelf.NoteList.splice(currentShelf.NoteList.indexOf(note),1);
        } else {
            note.name = this.vEditor.children[0].value;
            note.content = this.vEditor.children[1].value;
        }
        this.vEditor.children[0].value = "";
        this.vEditor.children[1].value = "";
        ShelfView(this.currentShelf);
    }

    //define deleting a note
    this.hDelete = () => {
        currentShelf.NoteList.splice(currentShelf.NoteList.indexOf(note),1);
        this.vEditor.children[0].value = "";
        this.vEditor.children[1].value = "";
        ShelfView(this.currentShelf);
    }

    //Add a one-time save function to the close button
    this.tClose.addEventListener('click', hClose, {once : true});

    //Add the one-time delete function to the delete button
    this.tDelete.addEventListener('click', hDelete, {once : true});

    //Alter the visibility of UI elements
    this.tShelfList.disabled = true;
    this.tNewNote.disabled = true;
    this.tDelete.style.display = "block";
    this.vList.style.display = "none";
    this.tClose.style.display = "block";
    this.vEditor.style.display = "block";
}
