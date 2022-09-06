class Note {
  constructor(name, content, color) {
    this.name = name;
    this.content = content;
    this.color = color;
    this.completed = false;
    this.uuid = crypto.randomUUID();
  }
}

class Shelf {
  // definition of a shelf, an array collection of notes.
  constructor(name, notes, color, icon) {
    this.notes = notes == undefined ? [] : notes;
    this.name = name == undefined ? "Untitled" : name;
    this.color = color == undefined ? "#000000" : color;
    this.icon = icon == undefined ? "bi-list-ul" : icon;
    this.uuid = crypto.randomUUID();
  }
}

class App {
  constructor(lists, activeList, activeNote) {
    // replaces init()
    jQuery.fn.extend({
      showModal: function () {
        return this.each(function () {
          if (this.tagName === "DIALOG") {
            this.showModal();
          }
        });
      },
    });

    this.lists = lists;
    this.activeList = activeList;
    this.activeNote = activeNote; //only set in editing mode?

    this.tool = {
      //buttons
      logo: $("#logo"),
      newList: $("#tNewShelf"),
      newNote: $("#tNewNote"),
      deleteNote: $("#tDeleteNote"),
      closeNote: $("#tCloseNote"),
      listColor: $("#tListColor"),
    };

    this.view = {
      rename: $("#vRenameShelf"),
      delete: $("#vDeleteShelf"),
    };

    this.input = {
      //input fields
      listName: $("#iListName"),
      noteName: $("#iNoteName"),
      noteContent: $("#iNoteContent"),
      listColor: $("#iListColor"),
    };

    this.component = {
      //UI elements, headers, paragraphs, etc.
      deleteHeader: $("#cDeleteHeader"),
      renameHeader: $("#cRenameHeader"),
      listHeader: $("#tShelfListOuter"),
      noteList: $("#list"),
      listSelector: $("#shelfmenu"),
    };

    // add global listener to go home on logo click
    this.tool.logo.on("click", () => {
      this.viewList(this.activeList);
    });

    this.input.listColor.on("input", () => {
      this.tool.listColor.css("border-color", this.input.listColor.val());
    });

    // add a global listener to add a new shelf
    this.tool.newList.on("click", () => {
      this.createList();
    });

    // add the global listener to make a new note
    this.tool.newNote.on("click", () => {
      this.createNote();
    });

    //add the global listener to close and save the active note
    this.tool.closeNote.on("click", () => {
      this.saveNote(this.activeNote);

      this.input.noteName.val("");
      this.input.noteContent.val("");

      this.viewList(this.activeList);
    });

    // add the global listener to delete the active note
    this.tool.deleteNote.on("click", () => {
      this.deleteNote(this.activeNote, this.activeList);

      this.input.noteName.val("");
      this.input.noteContent.val("");

      this.viewList(this.activeList);
    });

    // register autosave-on-close listener
    document.addEventListener("visibilitychange", () => {
      this.close("TitleStoredShelves");
    });

    if (this.lists == undefined || this.activeList == undefined) {
      this.open("TitleStoredShelves").then(() => {
        this.viewList(this.lists[0]);
      });
    }
  }

  async open(key) {
    this.lists = [];
    let retrieved = JSON.parse(window.localStorage.getItem(key));
    if (retrieved == null || retrieved.length == 0) {
      retrieved = await this.importData("./dep/application/demo.json");
    }
    retrieved.forEach((l) => {
      this.lists.push(l);
    });

    this.component.listSelector.html("");
    this.lists.forEach((l) => {
      this.component.listSelector.append(
        $(`
        <li class="notelist-item" uuid="${l.uuid}">
        <button class="dropdown-item shelf-name" id="${l.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
          <div style="color: ${l.color};">${l.name}<div>
          <button class="dropdown-item shelf-option" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <i class="bi bi-three-dots"></i>
          </button>
          <button class="dropdown-item shelf-option text-danger shelfop-delete" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <i class="bi bi-trash-fill"></i>
          </button>
        </button>
      </li>
      `)
      );
    });

    if (this.lists.length <= 1) {
      $(".shelfop-delete").css("display", "none");
    } else {
      $(".shelfop-delete").css("display", "inline-block");
    }
  }

  async importData(uri) {
    let raw = await fetch(uri);
    return await raw.json();
  }

  createList() {
    this.view.rename.one("close", () => {
      if (this.view.rename[0].returnValue == "yes") {
        let len = this.lists.push(
          new Shelf(this.input.listName.val(), [], this.input.listColor.val())
        );
        let l = this.lists[len - 1];
        this.viewList(l);

        this.component.renameHeader.html("");
        this.input.listName.val("");
        this.input.listColor.val("#000000");

        this.component.listSelector.append(
          $(`
        <li class="notelist-item" uuid="${l.uuid}">
          <button class="dropdown-item shelf-name" id="${l.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <div style="color: ${l.color};">${l.name}<div>
            <button class="dropdown-item shelf-option" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
              <i class="bi bi-three-dots"></i>
            </button>
            <button class="dropdown-item shelf-option text-danger shelfop-delete" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
              <i class="bi bi-trash-fill"></i>
            </button>
          </button>
        </li>
        `)
        );

        if (this.lists.length <= 1) {
          $(".shelfop-delete").css("display", "none");
        } else {
          $(".shelfop-delete").css("display", "inline-block");
        }
      }
    });

    this.input.listName.val("");
    this.input.listColor.val("#000000");
    this.tool.listColor.css("border-color", "#000000");
    this.component.renameHeader.html("New List");

    this.view.rename.showModal();
  }

  renameList(list) {
    this.view.rename.one("close", () => {
      if (this.view.rename[0].returnValue == "yes") {
        list.name = this.input.listName.val();
        list.color = this.input.listColor.val();
        list.notes.forEach((n) => {
          n.color = this.input.listColor.val();
          $(`.notecard[uuid=${n.uuid}]`).attr("style", `color: ${n.color}; border-color: ${n.color};`);
          $(`.notecard[uuid=${n.uuid}] input.tNoteStatus`).attr("style", `color: ${n.color}; border-color: ${n.color};`);
        });
        this.viewList(list);

        this.component.renameHeader.html("");
        this.input.listName.val("");
        this.input.listColor.val("#000000");
        this.tool.listColor.css("border-color", "#000000");

        $(`li.notelist-item[uuid=${list.uuid}] .shelf-name div`).html(list.name);
        $(`li.notelist-item[uuid=${list.uuid}] .shelf-name div`).css("color", list.color);
      }
    });

    this.input.listName.val(list.name);
    this.input.listColor.val(list.color);
    this.tool.listColor.css("border-color", list.color);
    this.component.renameHeader.html("Edit List");

    this.view.rename.showModal();
  }

  deleteList(list) {
    this.view.delete.one("close", () => {
      if (this.view.delete[0].returnValue == "yes") {
        this.lists.splice(this.lists.indexOf(list), 1);
        this.viewList(this.lists[this.lists.length - 1]);

        this.component.deleteHeader.html("");

        $(`li.notelist-item[uuid=${list.uuid}]`).remove();
        if (this.lists.length <= 1) {
          $(".shelfop-delete").css("display", "none");
        } else {
          $(".shelfop-delete").css("display", "inline-block");
        }
      }
    });

    this.component.deleteHeader.html(list.name);

    this.view.delete.showModal();
  }

  createNote(list) {
    let l = list == undefined ? this.activeList : list;
    let len = l.notes.push(new Note("", "", l.color));
    let n = l.notes[len - 1];
    this.viewNote(n);
    $(`
    <div class="card notecard" uuid="${n.uuid}" style="color: ${n.color
      }; border-color: ${n.color};">
    <div class="card-body">
      <div class="card-heading">
        <h5 class="card-title" contenteditable="true" onclick="{event.stopPropagation();}" oninput="Title.getNote(Title.activeList, '${note.uuid}').name = this.innerHTML; console.log(this.innerHTML);">${n.name == "" ? "Untitled Note" : n.name}</h5>
        <input type="checkbox" class="tNoteStatus" style="border-color: ${n.color}; color: ${n.color}" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${n.uuid}'), (event.currentTarget.checked ? true : false));}">
      </div>
      <div class="card-text">${n.content}</div>
      </div>
    </div> 
    `)
      .on("click", (e) => {
        this.viewNote(n);
      })
      .appendTo(this.component.noteList);
    if (l.notes.length >= 1) {
      $("#cEmptyListHeader").remove();
    }
  }

  getNote(list, uuid) {
    return list.notes.find((n) => { return n.uuid == uuid });
  }

  getList(uuid) {
    return this.lists.find((l) => { return l.uuid == uuid });
  }

  setNoteStatus(note, status) {
    status = (status == undefined ? 'false' : status);
    note.completed = status;
    $(`.notecard[uuid=${note.uuid}] .card-title`).css('text-decoration', (status == true ? 'line-through' : 'none'));
  }

  saveNote(note) {
    note.name = Title.input.noteName.val();
    note.content = Title.input.noteContent.val();
    //ToDo: alter physical component
    $(`.notecard[uuid=${note.uuid}]`).attr(
      "style",
      `color: ${note.color}; border-color: ${note.color};`
    );
    $(`.notecard[uuid=${note.uuid}] h5.card-title`).html(
      note.name == "" ? "Untitled Note" : note.name
    );
    $(`.notecard[uuid=${note.uuid}] div.card-text`).html(note.content);
  }

  deleteNote(note, list) {
    list = list == undefined ? Title.activeList : list; //use the active list if none defined
    if (note != undefined) {
      list.notes.splice(list.notes.indexOf(note), 1);
      Title.activeNote =
        Title.activeNote == note ? undefined : Title.activeNote; //unset active note if its the same note
    }
    $(`.notecard[uuid=${note.uuid}]`).remove();
    if (list.notes.length <= 0) {
      $(
        `<p id="cEmptyListHeader">No Notes, click <i class="bi bi-file-earmark-plus"></i> to add one!</p>`
      ).appendTo(this.component.noteList);
    }
  }

  viewList(list) {
    $("body").attr("activeView", "list");
    this.activeNote = undefined;
    document.title = list.name == undefined ? "Untitled List" : list.name;
    this.component.listHeader.html(
      list.name == undefined ? "Untitled List" : list.name
    );
    this.component.listHeader.css("color", list.color);
    this.component.listHeader.css("border-color", list.color);

    if (this.activeList == undefined || list != this.activeList) {
      this.activeList = list;
      this.component.noteList.html("");

      if (list.notes.length == 0) {
        $(
          `<p id="cEmptyListHeader">No Notes, click <i class="bi bi-file-earmark-plus"></i> to add one!</p>`
        ).appendTo(this.component.noteList);
      } else {
        list.notes.forEach((note) => {
          $(`
          <div class="card notecard" uuid="${note.uuid}" style="color: ${note.color}; border-color: ${note.color};">
          <div class="card-body">
            <div class="card-heading">
              <h5 class="card-title" contenteditable="true" onclick="{event.stopPropagation();}" oninput="Title.getNote(Title.activeList, '${note.uuid}').name = this.innerHTML; console.log(this.innerHTML);">${note.name == "" ? "Untitled Note" : note.name}</h5>
              <input type="checkbox" class="tNoteStatus" style="border-color: ${note.color}; color: ${note.color}" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${note.uuid}'), (event.currentTarget.checked ? true : false));}">
            </div>
            <div class="card-text">${note.content}</div>
            </div>
          </div> 
          `)
            .on("click", (e) => {
              this.viewNote(note);
            })
            .appendTo(this.component.noteList);
          if (note.completed == true) {
            $(`.notecard[uuid=${note.uuid}] .card-title`).css('text-decoration', 'line-through');
            $(`.notecard[uuid=${note.uuid}] .tNoteStatus`).prop('checked', true);
          }
        });
      }
    }
  }

  viewNote(note) {
    $("body").attr("activeView", "edit");
    Title.activeNote = note;

    this.input.noteName.val(note.name == undefined ? "" : note.name);
    this.input.noteContent.val(note.content == undefined ? "" : note.content);
    document.title = note.name == undefined ? "Untitled Note" : note.name;
    this.input.noteName.focus();
  }

  close(key) {
    window.localStorage.setItem(key, JSON.stringify(this.lists));
    //any other closing ops
  }
}

function init() {
  this.Title = new App();
}
