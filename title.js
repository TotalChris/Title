class Note {
  constructor(name, content, color) {
    this.name = name;
    this.content = content;
    this.color = color;
    this.uuid = crypto.randomUUID();
  }
}

class Shelf {
  // definition of a shelf, an array collection of notes.
  constructor(name, notes) {
    this.notes = (notes == undefined ? [] : notes);
    this.name = (name == undefined ? "Untitled" : name);
    this.uuid = crypto.randomUUID();
  }
}

class App {
  constructor(lists, activeList, activeNote){ // replaces init()
    jQuery.fn.extend({
      showModal: function() {
        return this.each(function() {
          if (this.tagName === 'DIALOG') {
            this.showModal();
          }
        });
      },
    });

    this.lists = lists;
    this.activeList = activeList;
    this.activeNote = activeNote; //only set in editing mode?

    this.tool = { //buttons
      logo : $('#logo'),
      newList : $('#tNewShelf'),
      newNote : $('#tNewNote'),
      deleteNote : $('#tDelete'),
      closeNote : $('#tClose'),
      noteColor : $('#tNoteColor')
    }

    this.dialog = { //dialogs
      rename : $('#dShelfName'),
      delete : $('#dDeleteShelf')
    }

    this.input = { //input fields
      listName : $('#iListName'),
      noteName : $('#docname'),
      noteColor : $('#doccolor'),
      noteContent : $('#doc')
    }

    this.component =  { //UI elements, headers, paragraphs, etc.
      deleteHeader : $('#cDeleteHeader'),
      renameHeader : $('#cRenameHeader'),
      listHeader : $('#tShelfListOuter'),
      noteList : $('#list'),
      listSelector : $('#shelfmenu'),
    }

    // add global listener to go home on logo click
    this.tool.logo.on('click', () => {
      this.viewList(this.activeList);
    });

    //add a tiny listener to match the color button border to the colorpicker
    this.input.noteColor.on('input', () => {
      $('#tNoteColor').css('border-color', this.input.noteColor.val());
    });

    // add a global listener to add a new shelf
    this.tool.newList.on('click', () => { 
      this.createList(); 
    });

    // add the global listener to make a new note
    this.tool.newNote.on('click', () => { 
      this.createNote(); 
    });

    //add the global listener to close and save the active note
    this.tool.closeNote.on('click', () => {
      this.saveNote(this.activeNote);

      this.input.noteName.val('');
      this.input.noteColor.val('#000000');
      this.input.noteContent.val('');

      this.viewList(this.activeList);
    })

    // add the global listener to delete the active note
    this.tool.deleteNote.on('click', () => { 
      this.deleteNote( this.activeNote, this.activeList ); 

      this.input.noteName.val('');
      this.input.noteColor.val('#000000');
      this.input.noteContent.val('');

      this.viewList(this.activeList);
    });

    $('#tCancelShelfName').on('click', () => {
      $('#fShelfName').submit();
    });

    $('#tCancelDeleteShelf').on('click', () => {
      $('#fDeleteShelf').submit();
    });

    // register autosave-on-close listener
    window.addEventListener('beforeunload', () => { this.close("TitleStoredShelves") });

    if(this.lists == undefined || this.activeList == undefined){
      this.open('TitleStoredShelves').then(() => {this.viewList(this.lists[0]);});
    }
  }

  async open(key){
    this.lists = [];
    let retrieved = JSON.parse(window.localStorage.getItem(key));
    if (retrieved == null || retrieved.length == 0) {
      retrieved = await this.importData('./demo.json');
    }
    retrieved.forEach((l) => { this.lists.push(l) });

    this.component.listSelector.html('');
    this.lists.forEach((s) => { 
      this.component.listSelector.append($(`
      <li class="notelist-item" uuid="${s.uuid}">
        <button class="dropdown-item shelf-name" id="${s.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${s.uuid}' }))">
          <div>${s.name}<div>
          <button class="dropdown-item shelf-option"><i class="bi bi-input-cursor-text" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${s.uuid}' }))"></i></button>
          <button class="dropdown-item shelf-option text-danger shelfop-delete"><i class="bi bi-trash-fill" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${s.uuid}' }))"></i></button>
        </button>
      </li>
      `));
    });

    if (this.lists.length <= 1) {
      $('.shelfop-delete').css('display', 'none');
    } else {
      $('.shelfop-delete').css('display', 'inline-block');
    }
  }

  async importData(uri){
    let raw = await fetch(uri);
    return await raw.json();
  }

  createList(){
    this.dialog.rename.one('close', () => {
      if (this.dialog.rename[0].returnValue == 'yes') {

        console.log(this.input.listName.val())
        let len = this.lists.push(new Shelf(this.input.listName.val(), []));
        let l = this.lists[len - 1];
        this.viewList(l);

        this.component.renameHeader.html('');
        this.input.listName.val('');


        this.component.listSelector.append($(`
        <li class="notelist-item" uuid="${l.uuid}">
          <button class="dropdown-item shelf-name" id="${l.uuid}" onclick="Title.viewList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))">
            <div>${l.name}<div>
            <button class="dropdown-item shelf-option"><i class="bi bi-input-cursor-text" onclick="Title.renameList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))"></i></button>
            <button class="dropdown-item shelf-option text-danger shelfop-delete"><i class="bi bi-trash-fill" onclick="Title.deleteList(Title.lists.find((s) => { return s.uuid == '${l.uuid}' }))"></i></button>
          </button>
        </li>
        `));
      }
    });

    this.input.listName.val('');
    this.component.renameHeader.html('New List');

    this.dialog.rename.showModal();
  }

  renameList(list){
    this.dialog.rename.one('close', () => {
      if (this.dialog.rename[0].returnValue == 'yes') {

        list.name = this.input.listName.val();
        this.viewList(list);

        this.component.renameHeader.html('');
        this.input.listName.val('');
        $(`li.notelist-item[uuid=${list.uuid}] .shelf-name div`).html(list.name);
        this.component.listHeader.html(list.name);

      }
    });

    this.input.listName.val(list.name);
    this.component.renameHeader.html(list.name);

    this.dialog.rename.showModal();
  }

  deleteList(list){
    this.dialog.delete.one('close', () => {
      if (this.dialog.delete[0].returnValue == 'yes') {

        this.lists.splice(this.lists.indexOf(list), 1);
        this.viewList(this.lists[this.lists.length - 1]);

        this.component.deleteHeader.html('');

        $(`li.notelist-item[uuid=${list.uuid}]`).remove();
        if (this.lists.length <= 1) {
          $('.shelfop-delete').css('display', 'none');
        } else {
          $('.shelfop-delete').css('display', 'inline-block');
        }
      }
    });

    this.component.deleteHeader.html(list.name);

    this.dialog.delete.showModal();
  }

  createNote(list){
    let l = (list == undefined ? this.activeList : list)
    let len = l.notes.push(new Note());
    let n = l.notes[len - 1]
    this.viewNote(n);
    $(`
    <div class="card notecard" uuid="${n.uuid}" style="color: ${n.color}; border-color: ${n.color};">
    <div class="card-body">
      <h5 class="card-title">${n.name == '' ? 'Untitled Note' : n.name}</h5>
      <div class="card-text">${n.content}</div>
      </div>
    </div> 
    `).on('click', (e) => {this.viewNote(n);}).appendTo(this.component.noteList);
    if(l.notes.length >= 1){
      $('#cEmptyListHeader').remove();
    }
  }

  saveNote(note){
    note.name = Title.input.noteName.val();
    note.color = Title.input.noteColor.val();
    note.content = Title.input.noteContent.val();
        //ToDo: alter physical component
    $(`.notecard[uuid=${note.uuid}]`).attr("style", `color: ${note.color}; border-color: ${note.color};`);
    $(`.notecard[uuid=${note.uuid}] h5.card-title`).html((note.name == '' ? 'Untitled Note' : note.name));
    $(`.notecard[uuid=${note.uuid}] div.card-text`).html(note.content);
  }

  deleteNote(note, list){
    list = (list == undefined ? Title.activeList : list); //use the active list if none defined
    if(note != undefined){
      list.notes.splice(list.notes.indexOf(note), 1);
      Title.activeNote = (Title.activeNote == note ? undefined : Title.activeNote); //unset active note if its the same note
    }
    $(`.notecard[uuid=${note.uuid}]`).remove()
    if(list.notes.length <= 0){
      $(`<p id="cEmptyListHeader">No Notes, click <i class="bi bi-file-earmark-plus"></i> to add one!</p>`).appendTo(this.component.noteList);
    }

  }

  viewList(list){
    $('body').attr('activeView', 'list');
    this.activeNote = undefined;
    document.title = (list.name == undefined ? 'Untitled List' : list.name);

    if(this.activeList == undefined || list != this.activeList){
      this.activeList = list;
      this.component.listHeader.html(list.name == undefined ? 'Untitled List' : list.name);
      this.component.noteList.html('');
  
      if (list.notes.length == 0) {
        $(`<p id="cEmptyListHeader">No Notes, click <i class="bi bi-file-earmark-plus"></i> to add one!</p>`).appendTo(this.component.noteList);
      } else {
        list.notes.forEach((note) => {
          $(`
          <div class="card notecard" uuid="${note.uuid}" style="color: ${note.color}; border-color: ${note.color};">
          <div class="card-body">
            <h5 class="card-title">${note.name == '' ? 'Untitled Note' : note.name}</h5>
            <div class="card-text">${note.content}</div>
            </div>
          </div> 
          `).on('click', (e) => {this.viewNote(note);}).appendTo(this.component.noteList);
        });
      }
    }
  }

  viewNote(note){
    $('body').attr('activeView', 'edit');
    Title.activeNote = note;

    this.input.noteName.val(note.name == undefined ? '' : note.name);
    this.input.noteContent.val(note.content == undefined ? '' : note.content);
    this.input.noteColor.val(note.color == undefined ? '#000000' : note.color);
    this.tool.noteColor.css('border-color', $('#doccolor').val());
    document.title = note.name == undefined ? 'Untitled Note' : note.name;
  }

  close(key){
    window.localStorage.setItem(key, JSON.stringify(this.lists));
    //any other closing ops
  }
}

function init(){
  this.Title = new App();
}