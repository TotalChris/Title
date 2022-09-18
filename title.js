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
      back: $("#tBack"),
      import: $("#tImport"),
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
      listHeader: $("#tPageTitle"),
      noteList: $("#vNoteList"),
      listSelector: $("#vFolderList"),
    };

    this.tool.back.on("click", () => {
      if ($('body').attr('activeview') == 'edit') {
        this.saveNote(this.activeNote);
        this.viewList(this.activeList);
      } else if ($('body').attr('activeview') == 'list') {
        this.viewAllLists();
      }
    })

    this.input.listColor.on("input", () => {
      this.tool.listColor.css("border-color", this.input.listColor.val());
    });

    // add a global listener to add a new shelf
    this.tool.newList.on("click", () => {
      this.createList();
    });

    this.tool.import.on('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        console.log(e.target.files[0])
        const reader = new FileReader();
        reader.addEventListener('load', (e) => {
          this.lists = JSON.parse(e.target.result);
          this.close("TitleStoredShelves");
          window.location.reload();
        })
        reader.readAsText(e.target.files[0]);
      } else {
        console.log('e')
      }
    })

    // add the global listener to make a new note
    this.tool.newNote.on("click", () => {
      this.createNote();
    });

    //add the global listener to close and save the active note
    this.tool.closeNote.on("click", () => {


      this.viewList(this.activeList);
    });

    // add the global listener to delete the active note
    this.tool.deleteNote.on("click", () => {
      this.deleteNote(this.activeNote, this.activeList);
      this.viewList(this.activeList);
    });

    // register autosave-on-close listener
    document.addEventListener("visibilitychange", () => {
      this.close("TitleStoredShelves");
    });

    if (this.lists == undefined || this.activeList == undefined) {
      this.open("TitleStoredShelves").then(() => {
        if (this.prefs.lastAction == "all") {
          this.viewAllLists();
        } else if (this.prefs.lastAction == "list") {
          this.viewList(this.getList(this.prefs.lastList));
        } else if (this.prefs.lastAction == "note") {
          this.viewList(this.getList(this.prefs.lastList));
          this.viewNote(this.getNote(this.getList(this.prefs.lastList), this.prefs.lastItem));
        }
        detectIncognito().then((result) => {
          if (result.isPrivate) {
            $('#vIncogWarn').showModal();
          }
        })
      });
    }
  }

  async open(key) {
    this.lists = [];
    let retrieved = JSON.parse(window.localStorage.getItem(key));
    let retrievedPrefs = JSON.parse(window.localStorage.getItem('TitlePrefs'))
    if (retrieved == null || retrieved.length == 0) {
      retrieved = await this.importData("./dep/application/demo.json");
    }
    if (retrievedPrefs == null || retrievedPrefs.length == 0) {
      retrievedPrefs = await this.importData("./dep/application/prefs.json");
    }
    retrieved.forEach((l) => {
      this.lists.push(l);
    });
    this.prefs = retrievedPrefs;


    this.component.listSelector.html("");
    this.lists.forEach((l) => {
      this.component.listSelector.append(
        $(`
        <li class="notelist-item" uuid="${l.uuid}">
        <button class="shelf-name" id="${l.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
        <div><i class="bi bi-folder" style="color: ${l.color};"></i>&nbsp;${l.name}</div>
          <button class="shelf-option" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <i class="bi bi-three-dots"></i>
          </button>
          <button class="shelf-option text-danger shelfop-delete" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
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

  async export() {
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(new Blob([JSON.stringify(this.lists)], { type: 'application/json' }));
    link.download = 'backup.json';
    link.click();
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
          <button class="shelf-name" id="${l.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <div><i class="bi bi-folder" style="color: ${l.color};"></i>&nbsp;${l.name}</div>
            <button class="shelf-option" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
              <i class="bi bi-three-dots"></i>
            </button>
            <button class="shelf-option text-danger shelfop-delete" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
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
    this.component.renameHeader.html("New Folder");

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

        this.component.renameHeader.html("");
        this.input.listName.val("");
        this.input.listColor.val("#000000");
        this.tool.listColor.css("border-color", "#000000");

        $(`li.notelist-item[uuid=${list.uuid}] .shelf-name div`).html(`<i class="bi bi-folder" style="color: ${list.color};"></i>&nbsp;${list.name}`);
      }
    });

    this.input.listName.val(list.name);
    this.input.listColor.val(list.color);
    this.tool.listColor.css("border-color", list.color);
    this.component.renameHeader.html("Edit Folder");

    this.view.rename.showModal();
  }

  deleteList(list) {
    this.view.delete.one("close", () => {
      if (this.view.delete[0].returnValue == "yes") {
        this.lists.splice(this.lists.indexOf(list), 1);

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

    $(`
    <div class="card notecard" uuid="${n.uuid}">
    <div class="card-body">
      <div class="card-heading">
        <input type="checkbox" class="tNoteStatus" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${n.uuid}'), (event.currentTarget.checked ? true : false));}">
        <h5 class="card-title" placeholder="Untitled" contenteditable="true" onclick="{event.stopPropagation();this.focus();}" oninput="if(event.inputType == 'insertParagraph' || (event.data == null && event.inputType == 'insertText')){this.innerHTML = this.textContent;this.blur();event.preventDefault();}; Title.getNote(Title.activeList, '${n.uuid}').name = this.textContent;">${n.name == "" ? "" : n.name}</h5>
      </div>
      <div class="card-text">${n.content}</div>
      </div>
    </div> 
    `)
      .on("click", (e) => {
        this.viewNote(n);
      })
      .appendTo(this.component.noteList);
    $(`div.notecard[uuid=${n.uuid}] .card-title`).focus();
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
    $(`.notecard[uuid=${note.uuid}]`).css('opacity', (status == true ? '50%' : '100%'))
  }

  saveNote(note) {
    note.name = Title.input.noteName.val();
    note.content = Title.input.noteContent.val();

    $(`.notecard[uuid=${note.uuid}]`).attr(
      "style",
      `background-color: ${note.color}20; color: ${note.color}; border-color: ${note.color};`
    );
    $(`.notecard[uuid=${note.uuid}] h5.card-title`).html(
      note.name == "" ? "" : note.name
    );
    $(`.notecard[uuid=${note.uuid}] div.card-text`).html(note.content);
    $(`.notecard[uuid=${note.uuid}]`).css('opacity', (note.completed == true ? '50%' : '100%'))
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

  viewAllLists() {
    this.prefs.lastAction = 'all';
    window.localStorage.setItem('TitlePrefs', JSON.stringify(this.prefs));
    $("body").attr("activeView", "all");
    this.activeNote = undefined;
    this.activeList = undefined;
    document.title = "Folders";
    document.documentElement.style.setProperty('--fgcolor', `#000000`);
    document.documentElement.style.setProperty('--bgcolor', `#ffffff`);
    document.documentElement.style.setProperty('--fgcolorpass', `#00000010`);
    document.documentElement.style.setProperty('--fgcolormid', `#00000077`);
    $('meta[name="theme-color"]').attr('content', `#ffffff`);
  }

  viewList(list) {
    this.prefs.lastAction = 'list';
    this.prefs.lastList = list.uuid;
    window.localStorage.setItem('TitlePrefs', JSON.stringify(this.prefs));
    $("body").attr("activeView", "list");
    $("#tBack").html('<i class="bi bi-chevron-left"></i>&nbsp;Folders');
    this.activeNote = undefined;
    document.title = list.name == undefined ? "Untitled Folder" : list.name;
    this.component.listHeader.html(
      list.name == undefined ? "Untitled Folder" : list.name
    );
    document.documentElement.style.setProperty('--fgcolor', `${list.color}`);
    document.documentElement.style.setProperty('--bgcolor', `${this.hexhelper(list.color)}`);
    document.documentElement.style.setProperty('--fgcolorpass', `${list.color}20`);
    document.documentElement.style.setProperty('--fgcolormid', `${list.color}77`);
    $('meta[name="theme-color"]').attr('content', `${this.hexhelper(list.color)}`);

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
          <div class="card notecard" uuid="${note.uuid}">
          <div class="card-body">
            <div class="card-heading">
              <input type="checkbox" class="tNoteStatus" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${note.uuid}'), (event.currentTarget.checked ? true : false));}">
              <h5 class="card-title" placeholder="Untitled" contenteditable="true" onclick="{this.focus();event.stopPropagation();}" oninput="if(event.inputType == 'insertParagraph' || (event.data == null && event.inputType == 'insertText')){this.innerHTML = this.textContent;this.blur();event.preventDefault();}; Title.getNote(Title.activeList, '${note.uuid}').name = this.textContent;">${note.name == "" ? "" : note.name}</h5>
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
            $(`.notecard[uuid=${note.uuid}]`).css('opacity', '50%');
            $(`.notecard[uuid=${note.uuid}] .tNoteStatus`).prop('checked', true);
          }
        });
      }
    }
  }

  viewNote(note) {
    this.prefs.lastAction = 'note';
    this.prefs.lastItem = note.uuid;
    window.localStorage.setItem('TitlePrefs', JSON.stringify(this.prefs));
    $("body").attr("activeView", "edit");
    $("#tBack").html(`<i class="bi bi-chevron-left"></i>&nbsp;${this.activeList.name}`);
    Title.activeNote = note;

    this.input.noteName.val(note.name == undefined ? "" : note.name);
    this.input.noteContent.val(note.content == undefined ? "" : note.content);
    document.title = note.name == undefined ? "" : note.name;
  }

  close(key) {
    window.localStorage.setItem(key, JSON.stringify(this.lists));
    window.localStorage.setItem('TitlePrefs', JSON.stringify(this.prefs));
    //any other closing ops
  }

  hexhelper(hex) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    r = Math.ceil(255 - .125 * (255 - r))
    g = Math.ceil(255 - .125 * (255 - g))
    b = Math.ceil(255 - .125 * (255 - b))
    return "#" + r.toString(16) + g.toString(16) + b.toString(16);
  }
}

function init() {
  this.Title = new App();
}
