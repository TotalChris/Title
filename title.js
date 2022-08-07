class Note {
  //definition of a note, a two-component document with a title and content
  constructor(name, content) {
    this.name = name;
    this.content = content;
  }
}

class Shelf {
  //definition of a shelf, an array collection of notes.
  constructor() {
    this.NoteList = [];
    this.name = "";
    this.uuid = crypto.randomUUID();
  }
}

function init() { //initialize element references and global objects/listeners

  //jquery modal compatibility
  jQuery.fn.extend({showModal: function() {
        return this.each(function() {
           if(this.tagName=== "DIALOG"){
                this.showModal();
            }
        });
  }});

  this.shelflist = [];
  this.stored = JSON.parse(window.localStorage.getItem("TitleStoredShelves")); //grab the stored list
  if (this.stored == null || this.stored.length == 0) { //init when no data is present
    this.loneshelf = new Shelf();
    this.loneshelf.name = "Notes";
    this.loneshelf.NoteList[0] = new Note();
    this.loneshelf.NoteList[0].name = "Welcome to Title!"
    this.loneshelf.NoteList[0].content = `This is a simple note in Title! It's a tiny web application that anyone can download and install on their phone, tablet, computer, and more! It has simple controls to create plaintext notes and separate them into lists. 

Title stores your notes in your web browser's local storage when you leave the app, meaning that everything you make here stays on the device you're using and is never shared with third parties or apps. This does also mean that each device and web browser you use will have separate notes and lists, but for a small app that's not a terrible thing!
    
Title's core functionality was made in a single day, and the few big changes since then have been bug fixes and code cleanup. Title adopts a minimalist webpage style, meaning that the UI loads instantly with no lag or overhead.
    
Thanks for using Title!`
    this.shelflist[0] = this.loneshelf;
  } else {
    this.stored.forEach((l) => {
      this.shelflist[this.shelflist.length] = l; //extract each shelf and re-add it to our copy
    });
  }

  //associate element references
  this.tShelfNameValue = $("#tShelfNameValue");
  this.dShelfName = $("#dShelfName");
  this.dDeleteShelf = $("#dDeleteShelf");
  this.tShelfList = $("#shelflist");
  this.tNewShelf = $("#tNewShelf");
  this.vEditor = $("#editor");
  this.vList = $("#list");
  this.tClose = $("#tClose");
  this.tDelete = $("#tDelete");
  this.tNewNote = $("#tNewNote");
  this.tRenameShelf = $("#tRenameShelf");
  this.tDeleteShelf = $("#tDeleteShelf");
  this.doc = $("#doc");
  this.hCloseNote = () => {};
  this.hDeleteNote = () => {};

  $('#tCancelShelfName').on('click', () => {$('#fShelfName').submit()})
  $('#tCancelDeleteShelf').on('click', () => {$('#fDeleteShelf').submit()})

  //register autosave-on-close listener
  window.addEventListener("beforeunload", () => {
    window.localStorage.setItem("TitleStoredShelves", JSON.stringify(this.shelflist));
  });

  //add the global listener to make a new note
  this.tNewNote.on("click", () => {
    let freshnote = new Note();
    currentShelf.NoteList[currentShelf.NoteList.length] = freshnote;
    EditView(freshnote);
  });

  //add a global event listener to the shelf switcher
  this.tShelfList.on("change", (e) => {
    //strict match the click value with the new shelf tool value to determine if "New shelf" was clicked
    if (e.target.value == this.tNewShelf.val()) {
      ShelfView(this.currentShelf);
      this.dShelfName.one("close", () => {
        //add an event listener to the popup for closing
        if(this.dShelfName[0].returnValue == "yes" && this.tShelfNameValue != ""){ //as long as it's okay to do so
          let freshshelf = new Shelf();
          freshshelf.name = this.tShelfNameValue.val();
          this.tShelfNameValue.val(""); //clear the input
          this.shelflist[this.shelflist.length] = freshshelf; //add shelf to the list
          ShelfView(freshshelf); //update and select
        }
      });
      this.tShelfNameValue.val("");
      this.dShelfName.showModal();
    } else {
      ShelfView(
        this.shelflist.find((s) => {
          return s.uuid == e.target.value;
        })
      ); //find the shelf by uuid and select/render it
    }
  });

  //add a global listener to rename a shelf
  this.tRenameShelf.on('click', () => {
    this.dShelfName.one("close", () => {  //add an event listener to the popup for closing
      if(this.dShelfName[0].returnValue == "yes" && this.tShelfNameValue != ""){
        this.currentShelf.name = this.tShelfNameValue.val();
        this.tShelfNameValue.val("");
        ShelfView(this.currentShelf);  //update and select
      }
    });
    this.tShelfNameValue.val(this.currentShelf.name); //add the current name into the box to edit
    this.dShelfName.showModal();
  })

  //add a global event lister to delete a shelf
  this.tDeleteShelf.on('click', () => {
    this.dDeleteShelf.one("close", () => {
      //delete the shelf only if the dialog returned a confirmation
      if(this.dDeleteShelf[0].returnValue == "yes"){
        this.shelflist.splice(this.shelflist.indexOf(this.currentShelf), 1); //remove the shelf from the list
        ShelfView(this.shelflist[this.shelflist.length - 1]);
      }
    })
    this.dDeleteShelf.showModal();
  })

  //start the app in shelf view with the first shelf we added
  ShelfView(this.shelflist[0]);
}

function UpdateShelves(shelftoset) {
  //re-renders the shelf dialog and selects the desired shelf object in the list
  //also autosaves the shelflist because safari is acting up

  this.tShelfList.html(""); //clear it

  this.shelflist.forEach((s) => { //add the shelves currently in our collection
    this.tShelfList.append($(`<option value="${s.uuid}" id="${s.uuid}">${s.name}</option>`));
  });

  if(this.shelflist.length <= 1){ //disable the delete option 
    this.tDeleteShelf.attr('disabled', '');
  } else {
    this.tDeleteShelf.removeAttr('disabled');
  }

  this.tShelfList.append(this.tNewShelf); //add the newshelf entry
  $(`#${shelftoset.uuid}`).prop('selected', 'true');
  this.currentShelf = shelftoset; //update global currentshelf
  window.localStorage.setItem("TitleStoredShelves", JSON.stringify(this.shelflist));

}

function ShelfView(shelf) {  //transitions to list note view using the current shelf
  
  document.title = (shelf.name == undefined ? "Untitled List" : shelf.name);

  UpdateShelves(shelf);

  //Clear and re-render the note list
  this.vList.html("");

  //show a notice if there are no notes in the shelf
  if (shelf.NoteList.length == 0) {
    $(`<p>No Notes, click 'New Note' to add one!</p>`).appendTo(this.vList);
  }

  //add the notes from the shelf to the list
  shelf.NoteList.forEach((note) => {
    $(`<a href="#">${(note.name == "" ? "Untitled Note" : note.name)}</a>`).on("click", (e) => {this.EditView(note);}).appendTo(this.vList);
    $('<br>').appendTo(this.vList);
  });

  //Alter the visibility of UI elements
  this.tShelfList.removeAttr("disabled");
  this.tNewNote.removeAttr("disabled");
  this.tRenameShelf.css("display", "block");
  this.tDeleteShelf.css("display", "block");
  this.tDelete.css("display", "none");
  this.vList.css("display", "block");
  this.tClose.css("display", "none");
  this.vEditor.css("display", "none");
}

function EditView(note) {  //transitions to editing view with a given note ref

  //avoid 'undefined' in new or empty notes
  $("#docname").val((note.name == undefined ? "" : note.name));
  $("#doc").val((note.content == undefined ? "" : note.content));
  document.title = (note.name == undefined ? "Untitled Note" : note.name);

  //remove old event listeners from tool buttons to prevent cross-deletion
  this.tClose.off("click");
  this.tDelete.off("click");

  //Add a one-time save function to the close button
  this.tClose.one("click", () => {
    if (
      $("#doc").val() == undefined &&
      $("#docname").val() == undefined
    ) {
      currentShelf.NoteList.splice(currentShelf.NoteList.indexOf(note), 1);
    } else {
      note.name = $("#docname").val();
      note.content = $("#doc").val();
    }
    $("#docname").val("");
    $("#doc").val("");
    ShelfView(this.currentShelf);
  });

  //Add the one-time delete function to the delete button
  this.tDelete.one("click", () => {
    currentShelf.NoteList.splice(currentShelf.NoteList.indexOf(note), 1);
    $("#docname").val("");
    $("#doc").val("");
    ShelfView(this.currentShelf);
  });

  //Alter the visibility of UI elements
  this.tShelfList.attr("disabled", "");
  this.tNewNote.attr("disabled", "");
  this.tRenameShelf.css("display", "none");
  this.tDeleteShelf.css("display", "none");
  this.tDelete.css("display", "block");
  this.vList.css("display", "none");
  this.tClose.css("display", "block");
  this.vEditor.css("display", "block");
}
