class Note {
  constructor(name, content) {
    this.name = name;
    this.content = content;
    this.completed = false;
    this.uuid = crypto.randomUUID();
  }
}

class Shelf {
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
    this.handlers = {
      keypressTitle: (event) => {
        if (event.keyCode == 13) {
          event.preventDefault();
          $('#iNoteContent').focus();
        }
      },
      inputTitle: (event) => {
        event.target.style.height = '5px';
        event.target.style.height = (event.target.scrollHeight) + 'px';
      }
    }
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
      shareNote: $("#tShareNote"),
      downNote: $("#tDownNote"),
    };

    this.view = {
      delete: $("#vDeleteShelf"),
      deleteNote: $("#vDeleteNote")
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
      deleteNoteHeader: $("#cDeleteNoteHeader"),
      listHeader: $("#tPageTitle"),
      noteList: $("#vNoteList"),
      listSelector: $("#vFolderList"),
    };

    this.tool.back.on("click", () => {
      if ($('body').attr('activeview') == 'edit') {
        this.saveNote(this.activeNote);
        this.viewList(this.activeList);
      } else if ($('body').attr('activeview') == 'list' || $('body').attr('activeview') == 'editf') {
        this.viewAllLists();
      }
    })

    this.tool.shareNote.on("click", () => {
      this.shareNote(this.activeNote);
    })

    this.tool.downNote.on("click", () => {
      this.exportNote(this.activeNote);
    })

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
        } else if (this.prefs.lastAction == "editf") {
          this.renameList(this.getList(this.prefs.lastList));
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
      if(!('icon' in l)){
        l.icon = 'bi-folder';
      }
      l.notes.forEach((n) => { //remove note color from old notes
        if('color' in n){
          delete n['color'];
        }
      })
      this.component.listSelector.append(
        $(`
        <li class="notelist-item" uuid="${l.uuid}">
        <button class="shelf-name" id="${l.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
        <div><i class="bi ${l.icon} folder-icon" style="background-color: ${l.color};"></i>&nbsp;${l.name}</div>
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
    let len = this.lists.push(
      new Shelf("Untitled", [], '#B92D5D', 'bi-folder')
    );
    let l = this.lists[len - 1];
    this.component.listSelector.append(
      $(`
    <li class="notelist-item" uuid="${l.uuid}">
      <button class="shelf-name" id="${l.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
        <div><i class="bi ${l.icon} folder-icon" style="background-color: ${l.color};"></i>&nbsp;${l.name}</div>
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
    this.renameList(l);
    if (this.lists.length <= 1) {
      $(".shelfop-delete").css("display", "none");
    } else {
      $(".shelfop-delete").css("display", "inline-block");
    }
  }

  renameList(list) {
    this.input.listName.off('input');
    this.input.listColor.off('input');
    this.prefs.lastAction = 'editf';
    this.prefs.lastList = list.uuid;
    window.localStorage.setItem('TitlePrefs', JSON.stringify(this.prefs));
    $("#tBack").html('<i class="bi bi-chevron-left"></i>&nbsp;Folders');
    this.activeNote = undefined;
    document.title = list.name == undefined ? "Untitled Folder" : list.name;


    $('body').attr('activeview', 'editf');
    document.documentElement.style.setProperty('--fgcolor', `${list.color}`);
    document.documentElement.style.setProperty('--bgcolor', `${this.hexhelper(list.color)}`);
    document.documentElement.style.setProperty('--fgcolorpass', `${list.color}20`);
    document.documentElement.style.setProperty('--fgcolormid', `${list.color}77`);
    this.input.listName.val(list.name);
    this.input.listColor.val(list.color);
    this.input.listName.on('input', (e) => {
      list.name = e.target.value;
      $(`li.notelist-item[uuid=${list.uuid}] .shelf-name div`).html(`<i class="bi bi-folder" style="color: ${list.color};"></i>&nbsp;${list.name}`);
    })
    this.input.listColor.on('input', (e) => {
      let c = e.target.value;
      list.color = c;
      document.documentElement.style.setProperty('--fgcolor', `${c}`);
      document.documentElement.style.setProperty('--bgcolor', `${this.hexhelper(c)}`);
      document.documentElement.style.setProperty('--fgcolorpass', `${c}20`);
      document.documentElement.style.setProperty('--fgcolormid', `${c}77`);
      $('meta[name="theme-color"]').attr('content', `${this.hexhelper(c)}`);
      $(`li.notelist-item[uuid=${list.uuid}] .shelf-name div`).html(`<i class="bi bi-folder" style="color: ${list.color};"></i>&nbsp;${list.name}`);
    })
  }

  deleteList(list) {
    if(this.activeList == list){
      this.viewAllLists();
    }
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

  createNote(list, note) {
    let l = (list == undefined ? this.activeList : list);
    let len = l.notes.push((note == undefined ? new Note("" ,"") : note));

    let n = l.notes[len - 1];

    $(`
    <div class="notecard" uuid="${n.uuid}">
    <div>
      <div class="card-heading">
        <input type="checkbox" class="tNoteStatus" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${n.uuid}'), (event.currentTarget.checked ? true : false));}">
        <h5 class="card-title" placeholder="Untitled" contenteditable="true" onclick="{event.stopPropagation();this.focus();}" oninput="if(event.inputType == 'insertParagraph' || (event.data == null && event.inputType == 'insertText')){this.innerHTML = this.textContent;this.blur();event.preventDefault();}; Title.getNote(Title.activeList, '${n.uuid}').name = this.textContent;">${n.name == "" ? "" : n.name}</h5>
        <button class="note-option" onclick="event.stopPropagation();Title.viewNote(Title.getNote(Title.activeList, '${n.uuid}' ))">
          <i class="bi bi-three-dots"></i>
        </button>
        <button class="note-option" onclick="event.stopPropagation();Title.deleteNote(Title.getNote(Title.activeList, '${n.uuid}' ), Title.activeList)">
          <i class="bi bi-trash-fill"></i>
        </button>
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

    $(`.notecard[uuid=${note.uuid}] h5.card-title`).html(
      note.name == "" ? "" : note.name
    );
    $(`.notecard[uuid=${note.uuid}] div.card-text`).html(note.content);
    $(`.notecard[uuid=${note.uuid}]`).css('opacity', (note.completed == true ? '50%' : '100%'))
  }

  shareNote(note) {
    let shareData = {
      title: note.name,
      text: note.content,
    }
    navigator.share(shareData).finally(()=>{});
  }

  async exportNote(note) {
    let f = new File([note.content], note.name + ".txt", { type: "text/plain" })

    if (navigator.canShare && navigator.canShare({ files: [f] }) && ( navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i) )) {
      navigator.share({
        files: [f],
        title: note.name,
        text: '',
      })
      .then(() => console.log('Export was successful.'))
      .catch((error) => console.log('Export failed', error));
    } else {
      const fileHandle = await window.showSaveFilePicker({
        "suggestedName" : note.name, 
        "excludeAcceptAllOption": true, 
        "types": [
          {
            description: 'Plain Text',
            accept: {
              'text/plain': ['.txt'],
            },
          },
        ]
      });
      const fileStream = await fileHandle.createWritable();
      await fileStream.write(new Blob([note.content], {type: "text/plain"}));
      await fileStream.close();
    }
  }

  deleteNote(note, list) {
    let d = () => {
      list = list == undefined ? Title.activeList : list; //use the active list if none defined
      if (note != undefined) {
        list.notes.splice(list.notes.indexOf(note), 1);
        Title.activeNote = (Title.activeNote == note ? undefined : Title.activeNote); //unset active note if its the same note
      }
      $(`.notecard[uuid=${note.uuid}]`).remove();
      if (list.notes.length <= 0) {
        $(`<p id="cEmptyListHeader">No Notes, click <i class="bi bi-file-earmark-plus"></i> to add one!</p>`).appendTo(this.component.noteList);
      }
    }
    this.view.deleteNote.one("close", () => {
      if (this.view.deleteNote[0].returnValue == "yes") {
        d();
      }
    })
    this.viewList(this.activeList);
    if(note.content == ""){
      d();
    } else {
      this.component.deleteNoteHeader.html((note.name == "" ? "Untitled" : note.name));
      this.view.deleteNote.showModal();
    }
  }

  viewAllLists() {
    this.prefs.lastAction = 'all';
    window.localStorage.setItem('TitlePrefs', JSON.stringify(this.prefs));
    $("body").attr("activeView", "all");
    $("#tBack").html(`<i class="bi bi-fonts"></i>`)
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
      `<i class="bi ${list.icon}"></i>&nbsp;` + (list.name == undefined ? "Untitled Folder" : list.name)
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
          <div class="notecard" uuid="${note.uuid}">
          <div>
            <div class="card-heading">
              <input type="checkbox" class="tNoteStatus" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${note.uuid}'), (event.currentTarget.checked ? true : false));}">
              <h5 class="card-title" placeholder="Untitled" contenteditable="true" onclick="{this.focus();event.stopPropagation();}" oninput="if(event.inputType == 'insertParagraph' || (event.data == null && event.inputType == 'insertText')){this.innerHTML = this.textContent;this.blur();event.preventDefault();}; Title.getNote(Title.activeList, '${note.uuid}').name = this.textContent;">${note.name == "" ? "" : note.name}</h5>
              <button class="note-option" onclick="event.stopPropagation();Title.viewNote(Title.getNote(Title.activeList, '${note.uuid}' ))">
                <i class="bi bi-three-dots"></i>
              </button>
              <button class="note-option" onclick="event.stopPropagation();Title.deleteNote(Title.getNote(Title.activeList, '${note.uuid}' ), Title.activeList)">
                <i class="bi bi-trash-fill"></i>
              </button>
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
    this.input.noteName.css('height', "5px");
    this.input.noteContent.css('height', "5px");
    this.input.noteName.css('height', this.input.noteName.prop('scrollHeight') + "px");
    this.input.noteContent.css('height', this.input.noteContent.prop('scrollHeight') + "px");
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
