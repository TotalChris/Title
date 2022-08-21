class Note {
  //definition of a note, a two-component document with a title and content
  constructor(name, content, color) {
    this.name = name;
    this.content = content;
    this.color = color;
    this.uuid = crypto.randomUUID();
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

function init() {
  //initialize element references and global objects/listeners

  //jquery modal compatibility
  jQuery.fn.extend({
    showModal: function () {
      return this.each(function () {
        if (this.tagName === "DIALOG") {
          this.showModal();
        }
      });
    },
  });

  this.shelflist = [];
  this.stored = JSON.parse(window.localStorage.getItem("TitleStoredShelves")); //grab the stored list
  if (stored == null || stored.length == 0) {
    //init when no data is present
    this.loneshelf = new Shelf();
    loneshelf.name = "Notes";
    loneshelf.NoteList[0] = new Note();
    loneshelf.NoteList[0].name = "Welcome to Title!";
    loneshelf.NoteList[0].content = `This is a simple note in Title! It's a tiny web application that anyone can download and install on their phone, tablet, computer, and more! It has simple controls to create plaintext notes and separate them into lists. 

Title stores your notes in your web browser's local storage when you leave the app, meaning that everything you make here stays on the device you're using and is never shared with third parties or apps. This does also mean that each device and web browser you use will have separate notes and lists, but for a small app that's not a terrible thing!
    
Title's core functionality was made in a single day, and the few big changes since then have been bug fixes and code cleanup. Title adopts a minimalist webpage style, meaning that the UI loads instantly with no lag or overhead.
    
Thanks for using Title!`;
    this.loneshelf.NoteList[0].color = "#B92D5D";
    shelflist[0] = loneshelf;
  } else {
    stored.forEach((l) => {
      shelflist[shelflist.length] = l; //extract each shelf and re-add it to our copy
    });
  }

  //associate element references
  this.tHeader = $("#header");
  this.tShelfNameValue = $("#tShelfNameValue");
  this.dShelfName = $("#dShelfName");
  this.dDeleteShelf = $("#dDeleteShelf");
  this.tShelfList = $("#tShelfList");
  this.tShelfListOuter = $("#tShelfListOuter");
  this.tShelfMenu = $("#shelfmenu");
  this.tNewShelf = $("#tNewShelf");
  this.vEditor = $("#editor");
  this.vList = $("#list");
  this.tClose = $("#tClose");
  this.tDelete = $("#tDelete");
  this.tNewNote = $("#tNewNote");
  this.doc = $("#doc");
  this.tLogo = $("#logo");
  this.vDeleteShelfTitle = $("#vDeleteShelfTitle");
  this.vShelfNameTitle = $("#vShelfNameTitle");
  this.vTableList = $("#tablelist");
  this.hCloseNote = () => {};
  this.hDeleteNote = () => {};

  $("#tCancelShelfName").on("click", () => {
    $("#fShelfName").submit();
  });
  $("#tCancelDeleteShelf").on("click", () => {
    $("#fDeleteShelf").submit();
  });

  //register autosave-on-close listener
  window.addEventListener("beforeunload", () => {
    window.localStorage.setItem(
      "TitleStoredShelves",
      JSON.stringify(shelflist)
    );
  });

  //add global listener to go home on logo click
  tLogo.on("click", () => {
    ShelfView(currentShelf);
  });

  $("#doccolor").on("input", () => {
    $("#tNoteColor").css("border-color", $("#doccolor").val())
  })

  //add a global listener to add a new shelf
  tNewShelf.on("click", () => {
    ShelfView(currentShelf);
    dShelfName.one("close", () => {
      //add an event listener to the popup for closing
      if (dShelfName[0].returnValue == "yes" && tShelfNameValue != "") {
        //as long as it's okay to do so
        let freshshelf = new Shelf();
        freshshelf.name = tShelfNameValue.val();

        vShelfNameTitle.html("");
        tShelfNameValue.val(""); //clear the input
        shelflist[shelflist.length] = freshshelf; //add shelf to the list
        ShelfView(freshshelf); //update and select
      }
    });
    tShelfNameValue.val("");
    vShelfNameTitle.html("New List");
    dShelfName.showModal();
  });

  //add the global listener to make a new note
  tNewNote.on("click", () => {
    let freshnote = new Note();
    currentShelf.NoteList[currentShelf.NoteList.length] = freshnote;
    EditView(freshnote);
  });

  //start the app in shelf view with the first shelf we added
  ShelfView(shelflist[0]);
}

function RenameShelf(shelf){
  dShelfName.one("close", () => {
    //add an event listener to the popup for closing
    if (dShelfName[0].returnValue == "yes" && tShelfNameValue != "") {
      shelf.name = tShelfNameValue.val();
      tShelfNameValue.val("");
      vShelfNameTitle.html("");
      ShelfView(shelf); //update and select
    }
  });
  tShelfNameValue.val(shelf.name); //add the current name into the box to edit
  vShelfNameTitle.html(shelf.name);
  dShelfName.showModal();
}

function DeleteShelf(shelf){
  dDeleteShelf.one("close", () => {
    //delete the shelf only if the dialog returned a confirmation
    if (dDeleteShelf[0].returnValue == "yes") {
      shelflist.splice(shelflist.indexOf(shelf), 1); //remove the shelf from the list
      ShelfView(shelflist[shelflist.length - 1]);
      vDeleteShelfTitle.html("");
    }
  });
  vDeleteShelfTitle.html(shelf.name);
  dDeleteShelf.showModal();
}

function UpdateShelves(shelftoset) {
  //re-renders the shelf dialog and selects the desired shelf object in the list
  //also autosaves the shelflist because safari is acting up

  tShelfMenu.html(""); //clear it

  shelflist.forEach((s) => {
    //add the shelves currently in our collection
    tShelfMenu.append(
      $(`
    <li class="notelist-item">
      <button class="dropdown-item shelf-name" id="${s.uuid}" onclick="ShelfView(shelflist.find((s) => { return s.uuid == '${s.uuid}' }))">
        ${s.name}
        <button class="dropdown-item shelf-option"><i class="bi bi-input-cursor-text" onclick="RenameShelf(shelflist.find((s) => { return s.uuid == '${s.uuid}' }))"></i></button>
        <button class="dropdown-item shelf-option text-danger shelfop-delete"><i class="bi bi-trash-fill" onclick="DeleteShelf(shelflist.find((s) => { return s.uuid == '${s.uuid}' }))"></i></button>
      </button>
    </li>
    `)
    );
  });

  if (shelflist.length <= 1) {
    //disable the delete option
    $(".shelfop-delete").css("display", "none");
  } else {
    $(".shelfop-delete").css("display", "inline-block");

  }

  $(`#${shelftoset.uuid}`).prop("selected", "true");
  currentShelf = shelftoset; //update global currentshelf
  window.localStorage.setItem("TitleStoredShelves", JSON.stringify(shelflist));
}

function UpdateNotes(shelf) {

}

function ShelfView(shelf) {
  //transitions to list note view using the current shelf

  tShelfListOuter.html(shelf.name == undefined ? "Untitled List" : shelf.name); //set the shelf name in the dropdown
  document.title = shelf.name == undefined ? "Untitled List" : shelf.name; //set the shelf name in the page title

  UpdateShelves(shelf); //update the shelf dropdown with current info

  //Clear and re-render the note list
  vList.html("");

  //show a notice if there are no notes in the shelf
  if (shelf.NoteList.length == 0) {
    $(
      `<p>No Notes, click <i class="bi bi-file-earmark-plus"></i> to add one!</p>`
    ).appendTo(vList);
  }

  //add the notes from the shelf to the list
  shelf.NoteList.forEach((note) => {
    $(`
    
    <div class="card notecard" style="max-height: 250px; color: ${note.color}; border-color: ${note.color};">
    <div class="card-body">
      <h5 class="card-title">${
        note.name == "" ? "Untitled Note" : note.name
      }</h5>
      <div class="card-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${
        note.content
      }</div>
      </div>
    </div> 
    `)
      .on("click", (e) => {
        this.EditView(note);
      })
      .appendTo(this.vList);
  });

  //Alter the visibility of UI elements
  tShelfList.css("display", "block");
  tNewNote.css("display", "block");
  tNewShelf.css("display", "block");
  tDelete.css("display", "none");
  vList.css("display", "block");
  tClose.css("display", "none");
  vEditor.css("display", "none");
  tHeader.css("width", "100%");
  $("#tNoteColor").css("display", "none");

}

function EditView(note) {
  //transitions to editing view with a given note ref

  //avoid 'undefined' in new or empty notes
  $("#docname").val(note.name == undefined ? "" : note.name);
  $("#doc").val(note.content == undefined ? "" : note.content);
  $("#doccolor").val(note.color == undefined ? "#000000" : note.color);
  $("#tNoteColor").css("border-color", $("#doccolor").val())
  document.title = note.name == undefined ? "Untitled Note" : note.name;

  //remove old event listeners from tool buttons to prevent cross-deletion
  tClose.off("click");
  tDelete.off("click");

  //Add a one-time save function to the close button
  tClose.one("click", () => {
    if ($("#doc").val() == undefined && $("#docname").val() == undefined) {
      currentShelf.NoteList.splice(currentShelf.NoteList.indexOf(note), 1);
    } else {
      note.name = $("#docname").val();
      note.content = $("#doc").val();
      note.color = $("#doccolor").val();
    }
    $("#doccolor").val("#000000");
    $("#docname").val("");
    $("#doc").val("");
    ShelfView(currentShelf);
  });

  //Add the one-time delete function to the delete button
  tDelete.one("click", () => {
    currentShelf.NoteList.splice(currentShelf.NoteList.indexOf(note), 1);
    $("#doccolor").val("#000000");
    $("#docname").val("");
    $("#doc").val("");
    ShelfView(currentShelf);
  });

  //Alter the visibility of UI elements
  tShelfList.css("display", "none");
  tNewNote.css("display", "none");
  tNewShelf.css("display", "none");
  tDelete.css("display", "block");
  vList.css("display", "none");
  tClose.css("display", "block");
  vEditor.css("display", "block");
  tHeader.css("width", "auto");
  $("#tNoteColor").css("display", "block");
  
}
