import { marked } from 'marked';
import { allowEvt, createEle, queryInfo, removeData } from './w3gdefs';
import { noteObj } from './w3gquestdata';
import { GenFetchInit } from './w3continfo';

function genNoteItem(notEmpty, isNote = true) {
  // console.log(`Inner: ${notEmpty} | isNote: ${isNote}`);
  return isNote
    ? createEle('span',
      typeof isNote === 'string'
        ? isNote
        : notEmpty
          ? 'Show'
          : 'Create',
      ['note-item', 'button']
    )
    : createEle('span', notEmpty);
}

async function saveOtherNotes(noteThis) {
  const noteData = noteThis.noteData;
  let textVal = noteThis.noteCont.querySelector('textarea').value;
  // const noteItem = noteThis.noteInfo.getInfo.querySelector('.note-cont-body .note-item');
  const notEmpty = !!textVal.trim();

  if (noteData !== textVal) {
    if (!notEmpty) {
      textVal = null;
    }
    // save to database
    const updateData = {
      id: noteThis.noteID,
      data: textVal,
      type: noteObj.noteUpdate[noteThis.noteType]
    };
    const modifCount = await queryInfo(
      '/query/request-modif',
      new GenFetchInit(
        null, null, null, null, false,
        updateData
      )
    );

    if (modifCount.modified === 0) {
      console.error('Something went wrong, no notes updated\nUpdate object:\n %o', updateData);
    }
    noteThis.noteData = textVal;
  }

  toggleOtherEdit(noteThis);
}

function toggleOtherEdit(noteThis, editMode = false) {
  const noteData = noteThis.noteData;
  const noteBodyEle = noteThis.noteCont;

  removeData(noteBodyEle);
  if (noteData === null || editMode) {
    const textArea = createEle(
      'textarea',
      null,
      null, null,
      {
        placeholder: 'Enter here your notes'
      });
    textArea.value = noteData !== null ? noteData : '';
    noteBodyEle.appendChild(textArea);
    noteBodyEle.appendChild(
      createEle('button', 'Save', ['note-bttn', 'note-save-bttn'])
    );
  } else {
    noteBodyEle.appendChild(createEle(
      'div',
      createEle('div', marked.parse(noteData), 'note-markdown-content'),
      'note-markdown'));
    noteBodyEle.appendChild(
      createEle('button', 'Edit', ['note-bttn', 'note-edit-bttn'])
    );
  }
}

async function getOtherNotes(noteThis) {
  const noteType = noteThis.noteType;
  const noteID = noteThis.noteID;
  const noteData = await queryInfo(noteObj.noteQuery[noteType](noteID));
  noteThis.noteData = noteData;
  toggleOtherEdit(noteThis);
}

/**
 *
 * @param {Event} evt
 */
async function toggleOtherNotes(evt) {
  const targCls = 'note-item';
  const notesCls = 'note-entries';
  const saveBttnCls = 'note-save-bttn';
  const editBttnCls = 'note-edit-bttn';
  const targEle = evt.target;
  const targEleCL = targEle.classList;
  const curTarg = evt.currentTarget;

  if (!allowEvt()) return;

  if (targEleCL.contains(targCls)) {
    const noteEles = curTarg.parentElement.getElementsByClassName(notesCls);

    for (const noteEle of noteEles) {
      if (noteEle === curTarg) continue;
      noteEle.classList.toggle('notes-closed');
    }

    if (this.showNote) {
      getOtherNotes(this);
      this.noteCont.classList.remove('notes-closed');
    } else {
      removeData(this.noteCont);
      this.noteCont.classList.add('notes-closed');
    }

    targEle.parentElement.replaceChild(
      genNoteItem(this.noteData, this.showNote ? 'Exit' : true),
      targEle
    );

    this.showNote = !this.showNote;
    curTarg.classList.toggle('open-note');
  } else if (targEleCL.contains(saveBttnCls)) {
    await saveOtherNotes(this);
  } else if (targEleCL.contains(editBttnCls)) {
    toggleOtherEdit(this, true);
  }
}

function toggleQuestNoteMode(noteThis, editMode = false) {
  const noteData = noteThis.cur.quest_notes;
  const noteContEle = noteThis.noteCont;

  removeData(noteContEle);
  if (editMode || noteData === null) {
    const textArea = createEle(
      'textarea',
      null, null, null,
      {
        placeholder: 'Enter here your notes'
      }
    );
    noteContEle.appendChild(textArea);
    noteContEle.appendChild(
      createEle(
        'button',
        'Save',
        'qt-note-bttn-save'
      )
    );

    if (noteData !== null) {
      textArea.value = noteData;
    }
  } else {
    noteContEle.appendChild(createEle(
      'div',
      createEle('div', marked.parse(noteData), 'note-markdown-content'),
      'note-markdown'
    ));
    noteContEle.appendChild(createEle(
      'button',
      'Edit',
      'qt-note-bttn-edit'
    ));
  }
}

async function saveQuestNote(noteThis) {
  const curData = noteThis.cur;
  const noteData = curData.quest_notes;
  const noteContEle = noteThis.noteCont;
  let textValue = noteContEle.querySelector('textarea').value;
  const notEmpty = !!textValue.trim();

  if (noteData !== textValue) {
    if (!notEmpty) {
      textValue = null;
    }
    const updateData = {
      id: curData.quest_id,
      regid: curData.region_id,
      data: textValue,
      type: 'qt'
    };
    const modif = await queryInfo(
      '/query/request-modif',
      new GenFetchInit(
        null, null, null, null, false,
        updateData
      )
    );
    if (modif.modified === 0) {
      console.error('Something went wrong, no notes updated\nUpdate object:\n %o', updateData);
    }
    curData.quest_notes = textValue;

    const newMenuBttn = modif.result.no_notes
      ? noteObj.imgObjs.nt.cloneNode()
      : noteObj.imgObjs.add.cloneNode();

    noteThis.menuBttn.replaceChild(
      newMenuBttn,
      noteThis.menuBttn.firstElementChild
    );
  }

  toggleQuestNoteMode(noteThis);
}

/**
 *
 * @param {Event} evt
 */
function questNoteEvents(evt) {
  const targEle = evt.target;
  const targCl = targEle.classList;
  const curTarg = evt.currentTarget;

  if (targCl.contains('qt-note-bttn-save')) {
    saveQuestNote(this);
  } else if (targCl.contains('qt-note-bttn-edit')) {
    toggleQuestNoteMode(this, true);
  } else if (targCl.contains('qt-regitem-bttn')) {
    for (const regNoteEntry of curTarg.parentElement.getElementsByClassName('qt-note-subreg')) {
      if (regNoteEntry === curTarg) {
        regNoteEntry.classList.toggle('open-note');
        continue;
      }
      regNoteEntry.classList.toggle('notes-closed');
    }

    const noteCont = curTarg.querySelector('.note-entry-cont');
    removeData(noteCont);
    noteCont.classList.toggle('notes-closed');
    const isShow = !noteCont.classList.contains('notes-closed');

    if (isShow) {
      toggleQuestNoteMode(this);
    }

    const regItemBttn = createEle('span',
      isShow
        ? 'Exit'
        : this.cur.quest_notes
          ? 'Show'
          : 'Create',
      ['qt-regitem-bttn', 'button']
    );
    this.regBttn.parentElement.replaceChild(
      regItemBttn,
      this.regBttn
    );
    this.regBttn = regItemBttn;
  }
}

function openQuestNote(questNoteData, menuBttn) {
  const questNoteCont = createEle('div');

  if (questNoteData.length === 1) {
    const noteThisData = { menuBttn };
    noteThisData.cur = questNoteData[0];
    questNoteCont.classList.add('note-entry-cont-single');
    noteThisData.noteCont = questNoteCont;
    toggleQuestNoteMode(noteThisData);

    questNoteCont.addEventListener('click', questNoteEvents.bind(noteThisData));
  } else {
    for (const questNote of questNoteData) {
      const noteThisData = { menuBttn };

      const noteCont = createEle('div', null, ['note-entry-cont', 'notes-closed']);
      const regItemBttn = createEle('span', questNote.quest_notes ? 'Show' : 'Create', ['qt-regitem-bttn', 'button']);
      const regNoteCont = createEle(
        'div',
        [
          createEle('div',
            [
              createEle('span', document.createTextNode(questNote.region_name), 'qt-note-regname'),
              regItemBttn
            ],
            'qt-note-regitem',
            null, null),
          noteCont
        ],
        'qt-note-subreg'
      );

      noteThisData.cur = questNote;
      noteThisData.noteCont = noteCont;
      noteThisData.regBttn = regItemBttn;
      regNoteCont.addEventListener('click', questNoteEvents.bind(noteThisData));
      questNoteCont.appendChild(regNoteCont);
    }
  }

  return questNoteCont;
}

export { toggleOtherNotes, genNoteItem, openQuestNote };
