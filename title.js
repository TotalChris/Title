class Note {
  constructor(name, content) {
    this.name = name;
    this.content = content;
    this.completed = false;
    this.uuid = crypto.randomUUID();
  }
}

class Shelf {
  constructor(name, notes, theme, icon) {
    this.notes = notes == undefined ? [] : notes;
    this.name = name == undefined ? "Untitled" : name;
    this.theme = theme == undefined ? {
      pale: '',
      light: '',
      dark: '',
      mute: '',
    } : theme;
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

    this.colors = {
      red: {
        pale: '#EFE4E4',
        light: '#EFBFC0',
        dark: '#331E1F',
        mute: '#1B1010',
      },
      yellow: {
        pale: '#EFEAE4',
        light: '#EFD9C0',
        dark: '#33291E',
        mute: '#1B1610',
      },
      green: {
        pale: '#E4EFE8',
        light: '#BEEFCF',
        dark: '#1E3325',
        mute: '#101B14',
      },
      blue: {
        pale: '#E4EAEF',
        light: '#BFD7EF',
        dark: '#1E2933',
        mute: '#10161B',
      },
      purple: {
        pale: '#E9E4EF',
        light: '#D6BFEF',
        dark: '#281E33',
        mute: '#15101B',
      },
      magenta: {
        pale: '#EFE4EC',
        light: '#EFBFE2',
        dark: '#331E2D',
        mute: '#1B1018',
      },
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
      noteList: {
        incomplete: $("#vIncomplete"),
        complete: $("#vComplete")
      },
      listSelector: $("#vFolderList"),
    };

    this.component.listHeader.on('click', ()=>{this.renameList(this.activeList)})

    this.tool.back.on("click", () => {
      if ($('body').attr('activeview') == 'edit') {
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
        const reader = new FileReader();
        reader.addEventListener('load', (e) => {
          this.lists = JSON.parse(e.target.result);
          this.prefs.lastAction = 'list';
          this.prefs.lastList = this.lists[0].uuid;
          this.close("TitleStoredShelves");
          window.location.reload();
        })
        reader.readAsText(e.target.files[0]);
      } else {
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

    $('#tFolderIcons button').on("click", (e) => {
      if(!(e.target instanceof HTMLButtonElement)){
        this.activeList.icon = "bi-" + $(e.target.parentNode).attr('icon');
      } else {
        this.activeList.icon = "bi-" + $(e.target).attr('icon');
      }
      $('#tFolderIconSwitcher').html(`<i class="bi ${this.activeList.icon}"></i>`);
      $(`li.notelist-item[uuid=${this.activeList.uuid}] .shelf-name div`).html(`<i class="bi ${this.activeList.icon} folder-icon" style="background-color: ${this.activeList.theme.pale}; color: ${this.activeList.theme.dark};"></i>&nbsp;${this.activeList.name}`);
    })

    $('#tFolderColors button').on('click', (e)=>{
      let colorName = ( !(e.target instanceof HTMLButtonElement) ? $(e.target.parentNode) : $(e.target) ).attr('color-name');
      this.activeList.theme = this.colors[colorName];
      document.documentElement.style.setProperty('--fgcolor', this.activeList.theme.dark);
      document.documentElement.style.setProperty('--bgcolor', this.activeList.theme.pale);
      document.documentElement.style.setProperty('--fgcolorpass', this.activeList.theme.light);
      document.documentElement.style.setProperty('--fgcolormid', this.activeList.theme.light);
      $('meta[name="theme-color"]').attr('content', `${this.activeList.theme.pale}`);
      $(`li.notelist-item[uuid=${this.activeList.uuid}] .shelf-name div`).html(`<i class="bi ${this.activeList.icon} folder-icon" style="background-color: ${this.activeList.theme.pale}; color: ${this.activeList.theme.dark};"></i>&nbsp;${this.activeList.name}`);
      $(`li.notelist-item[uuid=${this.activeList.uuid}] .shelf-name div`).css('color', `${this.activeList.theme.dark}`)
      $(`li.notelist-item[uuid=${this.activeList.uuid}] .shelf-option i`).css('color', `${this.activeList.theme.dark}`)
      $(`li.notelist-item[uuid=${this.activeList.uuid}] `).css('background-color', this.activeList.theme.light)

    })

    this.input.noteName.on('input', () => {
      $(`.notecard[uuid=${this.activeNote.uuid}] h2.card-title`).html(
        this.input.noteName.val() == "" ? "" : this.input.noteName.val()
      );
    })

    this.input.noteContent.on('input', () => {
      $(`.notecard[uuid=${this.activeNote.uuid}] div.card-text`).html(this.input.noteContent.val());
    })

    this.input.noteName.on('change', () => { this.activeNote.name = this.input.noteName.val(); })

    this.input.noteContent.on('change', () => { this.activeNote.content = this.input.noteContent.val(); })

    // register autosave-on-close listener
    document.addEventListener("visibilitychange", () => {
      if(this.prefs.lastAction == "note"){
        this.activeNote.name = this.input.noteName.val();
        this.activeNote.content = this.input.noteContent.val();
      }
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
        l.icon = 'bi-folder-fill';
      }
      if(!('theme' in l)){ //replace color with theme in old lists
        switch(l['color']){
          case '#b92d5d':
            l.theme = this.colors.magenta;
            break;
          case '#eb4d3d':
            l.theme = this.colors.red;
            break;
          case '#da5100':
            l.theme = this.colors.red;
            break;
          case '#d38301':
            l.theme = this.colors.yellow;
            break;
          case '#009000':
            l.theme = this.colors.green;
            break;
          case '#008cb4':
            l.theme = this.colors.blue;
            break;
          case '#285ff4':
            l.theme = this.colors.blue;
            break;
          case '#702898':
            l.theme = this.colors.purple;
            break;
          case '#7b2900':
            l.theme = this.colors.yellow;
            break;
          case '#333333':
            l.theme = this.colors.blue;
            break;
          default:
            l.theme = this.colors.red;
            break;
        }
        delete l['color'];
      }
      l.notes.forEach((n) => { //remove note color from old notes
        if('color' in n){
          delete n['color'];
        }
      })
      this.component.listSelector.append(
        $(`
        <li class="notelist-item" uuid="${l.uuid}" style="padding-inline: 1rem !important; background-color: ${l.theme.light};">
        <button class="shelf-name" id="${l.uuid}" aria-label="View ${l.name} Folder" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
        <div style="color: ${l.theme.dark};"><i class="bi ${l.icon} folder-icon" style="background-color: ${l.theme.pale}; color: ${l.theme.dark};"></i>&nbsp;${l.name}</div>
          <button class="shelf-option" aria-label="Edit ${l.name} Folder" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <i class="bi bi-info-circle" style="color: ${l.theme.dark};"></i>
          </button>
          <button class="shelf-option text-danger shelfop-delete" aria-label="Delete ${l.name} Folder" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <i class="bi bi-trash-fill" style="color: ${l.theme.dark};"></i>
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
      new Shelf("New Folder", [], this.colors.red, 'bi-folder-fill')
    );

    let l = this.lists[len - 1];
    this.component.listSelector.append(
      $(`
        <li class="notelist-item" uuid="${l.uuid}" style="padding-inline: 1rem !important; background-color: ${l.theme.light};">
        <button class="shelf-name" id="${l.uuid}" aria-label="View ${l.name} Folder" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
        <div style="color: ${l.theme.dark};"><i class="bi ${l.icon} folder-icon" style="background-color: ${l.theme.pale}; color: ${l.theme.dark};"></i>&nbsp;${l.name}</div>
          <button class="shelf-option" aria-label="Edit ${l.name} Folder" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <i class="bi bi-info-circle" style="color: ${l.theme.dark};"></i>
          </button>
          <button class="shelf-option text-danger shelfop-delete" aria-label="Delete ${l.name} Folder" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <i class="bi bi-trash-fill" style="color: ${l.theme.dark};"></i>
          </button>
        </button>
      </li>
    `)
    );
    document.documentElement.style.setProperty('--fgcolor', l.theme.dark);
    document.documentElement.style.setProperty('--bgcolor', l.theme.pale);
    document.documentElement.style.setProperty('--fgcolorpass', l.theme.light);
    document.documentElement.style.setProperty('--fgcolormid', l.theme.light);
    $('meta[name="theme-color"]').attr('content', `${l.theme.pale}`);
    $(`li.notelist-item[uuid=${l.uuid}] .shelf-name div`).html(`<i class="bi ${l.icon} folder-icon" style="background-color: ${l.theme.pale}; color: ${l.theme.dark};"></i>&nbsp;${l.name}`);
    $(`li.notelist-item[uuid=${l.uuid}] .shelf-name div`).css('color', `${l.theme.dark}`)
    $(`li.notelist-item[uuid=${l.uuid}] .shelf-option i`).css('color', `${l.theme.dark}`)
    $(`li.notelist-item[uuid=${l.uuid}] `).css('background-color', l.theme.light)
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
    this.activeList = list;
    document.title = list.name == undefined ? "Untitled Folder" : list.name;
    document.documentElement.style.setProperty('--fgcolor', this.activeList.theme.dark);
    document.documentElement.style.setProperty('--bgcolor', this.activeList.theme.pale);
    document.documentElement.style.setProperty('--fgcolorpass', this.activeList.theme.light);
    document.documentElement.style.setProperty('--fgcolormid', this.activeList.theme.light);
    $('meta[name="theme-color"]').attr('content', `${this.activeList.theme.pale}`);
    $(`li.notelist-item[uuid=${this.activeList.uuid}] .shelf-name div`).html(`<i class="bi ${this.activeList.icon} folder-icon" style="background-color: ${this.activeList.theme.pale}; color: ${this.activeList.theme.dark};"></i>&nbsp;${this.activeList.name}`);
    $(`li.notelist-item[uuid=${this.activeList.uuid}] .shelf-name div`).css('color', `${this.activeList.theme.dark}`)
    $(`li.notelist-item[uuid=${this.activeList.uuid}] .shelf-option i`).css('color', `${this.activeList.theme.dark}`)
    $(`li.notelist-item[uuid=${this.activeList.uuid}] `).css('background-color', this.activeList.theme.light)
    $('body').attr('activeview', 'editf');
    this.input.listName.val(list.name);
    this.input.listColor.val(list.theme.light);
    $('#tFolderIconSwitcher').html(`<i class="bi ${list.icon}"></i>`);
    this.input.listName[0].style.height = '5px';
    this.input.listName[0].style.height = (this.input.listName[0].scrollHeight) + 'px';
    this.input.listName.on('input', (e) => {
      list.name = e.target.value;
      $(`li.notelist-item[uuid=${list.uuid}] .shelf-name div`).html(`<i class="bi ${list.icon} folder-icon" style="background-color: ${list.theme.pale}; color: ${list.theme.dark};"></i>&nbsp;${list.name}`);
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
    if (l.notes.length >= 1) {
      $(`#cEmptyListHeader`).css('display', 'none');
      $(`#vNoteList`).css('display', 'block');
    }
    $(`
    <div class="notecard" uuid="${n.uuid}">
    <div>
      <div class="card-heading">
        <input type="checkbox" aria-label="Complete ${n.name}" class="tNoteStatus" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${n.uuid}'), (event.currentTarget.checked ? true : false));}">
        <h2 class="card-title" placeholder="Untitled" contenteditable="true" onclick="{event.stopPropagation();this.focus();}" oninput="if(event.inputType == 'insertParagraph' || (event.data == null && event.inputType == 'insertText')){this.innerHTML = this.textContent;this.blur();event.preventDefault();}; Title.getNote(Title.activeList, '${n.uuid}').name = this.textContent;">${n.name == "" ? "" : n.name}</h2>
        <button class="note-option" onclick="event.stopPropagation();Title.viewNote(Title.getNote(Title.activeList, '${n.uuid}' ))" aria-label="Edit ${n.name}">
          <i class="bi bi-pen-fill"></i>
        </button>
        <button class="note-option" aria-label="Delete ${n.name}" onclick="event.stopPropagation();Title.deleteNote(Title.getNote(Title.activeList, '${n.uuid}' ), Title.activeList)">
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
      .appendTo(this.component.noteList.incomplete);
    $(`div.notecard[uuid=${n.uuid}] .card-title`).focus();
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
    if(status){
      $(`.notecard[uuid=${note.uuid}]`).detach().appendTo(this.component.noteList.complete);
    } else {
      $(`.notecard[uuid=${note.uuid}]`).detach().appendTo(this.component.noteList.incomplete);
    }
    $(`.notecard[uuid=${note.uuid}] .card-title`).css('text-decoration', (status == true ? 'line-through' : 'none'));
    $(`.notecard[uuid=${note.uuid}]`).css('opacity', (status == true ? '75%' : '100%'))
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
      list = list == undefined ? this.activeList : list; //use the active list if none defined
      if (note != undefined) {
        list.notes.splice(list.notes.indexOf(note), 1);
        this.activeNote = (this.activeNote == note ? undefined : this.activeNote); //unset active note if its the same note
      }
      $(`.notecard[uuid=${note.uuid}]`).remove();
      if (list.notes.length <= 0) {
        $(`#cEmptyListHeader`).css('display', 'block')
        $(`#vNoteList`).css('display', 'none');
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
    $("#tBack").html(`<p style="margin-block: 0px; padding-inline: 10px; font-size: 26px; font-weight: 500;">Title</p>`)
    this.activeNote = undefined;
    this.activeList = undefined;
    document.title = "Books";
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
    $("#tBack").html('<i class="bi bi-chevron-left"></i>&nbsp;Books');
    this.activeNote = undefined;
    document.title = list.name == undefined ? "Untitled Folder" : list.name;
    this.component.listHeader.html(
      `<i class="bi ${list.icon}"></i>&nbsp;` + (list.name == undefined ? "Untitled Folder" : list.name)
    );
    document.documentElement.style.setProperty('--fgcolor', list.theme.dark);
    document.documentElement.style.setProperty('--bgcolor', list.theme.pale);
    document.documentElement.style.setProperty('--fgcolorpass', list.theme.light);
    document.documentElement.style.setProperty('--fgcolormid', list.theme.light);
    $('meta[name="theme-color"]').attr('content', list.theme.pale);

      this.activeList = list;
      this.component.noteList.incomplete.html("");
      this.component.noteList.complete.html("");

    if (list.notes.length == 0) {
      $(`#cEmptyListHeader`).css('display', 'block');
      $(`#vNoteList`).css('display', 'none');
    } else {
      $(`#cEmptyListHeader`).css('display', 'none');
      $(`#vNoteList`).css('display', 'block');
      list.notes.forEach((n) => {
        $(`
        <div class="notecard" uuid="${n.uuid}">
        <div>
          <div class="card-heading">
            <input type="checkbox" aria-label="Complete ${n.name}" class="tNoteStatus" onclick="{event.stopPropagation();Title.setNoteStatus(Title.getNote(Title.activeList, '${n.uuid}'), (event.currentTarget.checked ? true : false));}">
            <h2 class="card-title" placeholder="Untitled" contenteditable="true" onclick="{event.stopPropagation();this.focus();}" oninput="if(event.inputType == 'insertParagraph' || (event.data == null && event.inputType == 'insertText')){this.innerHTML = this.textContent;this.blur();event.preventDefault();}; Title.getNote(Title.activeList, '${n.uuid}').name = this.textContent;">${n.name == "" ? "" : n.name}</h2>
            <button class="note-option" onclick="event.stopPropagation();Title.viewNote(Title.getNote(Title.activeList, '${n.uuid}' ))" aria-label="Edit ${n.name}">
              <i class="bi bi-pen-fill"></i>
            </button>
            <button class="note-option" aria-label="Delete ${n.name}" onclick="event.stopPropagation();Title.deleteNote(Title.getNote(Title.activeList, '${n.uuid}' ), Title.activeList)">
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
          .appendTo(n.completed ? this.component.noteList.complete : this.component.noteList.incomplete);
        if (n.completed == true) {
          $(`.notecard[uuid=${n.uuid}] .card-title`).css('text-decoration', 'line-through');
          $(`.notecard[uuid=${n.uuid}] .tNoteStatus`).prop('checked', true);
          $(`.notecard[uuid=${n.uuid}]`).css('opacity', '75%');
        }
      });
    }
  }

  viewNote(note) {
    this.prefs.lastAction = 'note';
    this.prefs.lastItem = note.uuid;
    window.localStorage.setItem('TitlePrefs', JSON.stringify(this.prefs));
    $("body").attr("activeView", "edit");
    $("#tBack").html(`<i class="bi bi-chevron-left"></i>&nbsp;${this.activeList.name}`);
    this.activeNote = note;

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

}

function init() {
  this.Title = new App();
}

document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('load', () => {$("body").removeClass("preload");})