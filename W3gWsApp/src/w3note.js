import { marked } from 'marked';
import { allowEvt, createEle, queryInfo, removeData } from './w3gdefs';
import { noteObj } from './w3gquestdata';
import { GenFetchInit } from './w3continfo';

function genNoteItem(notEmpty, isNote = true) {
  // console.log(`Inner: ${notEmpty} | isNote: ${isNote}`);
  return isNote
    ? createEle('span', notEmpty ? 'show' : 'create', 'note-item')
    : createEle('span', notEmpty);
}

async function saveOtherNotes(noteThis, noteItem) {
  const noteData = noteThis.noteData;
  let textVal = noteThis.noteInfo.getInfo.querySelector('.note-cont-body textarea').value;
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

  noteItem.parentElement.replaceChild(
    genNoteItem(notEmpty, true),
    noteItem
  );

  toggleOtherEdit(noteThis);
}

function toggleOtherEdit(noteThis, editMode = false) {
  const noteData = noteThis.noteData;
  const noteBodyEle = noteThis.noteInfo.getInfo.querySelector('.note-cont-body');
  const saveBttnEle = noteThis.noteInfo.getInfo.querySelector('.note-save-bttn');

  removeData(noteBodyEle);
  if (noteData === null || editMode) {
    const textArea = createEle(
      'textarea',
      null,
      null, null,
      {
        rows: '5',
        cols: '45',
        placeholder: 'Enter here your notes'
      });
    textArea.value = noteData !== null ? noteData : '';
    noteBodyEle.appendChild(textArea);
    saveBttnEle.classList.remove('notes-closed');
  } else {
    noteBodyEle.appendChild(createEle(
      'div',
      marked.parse(noteData),
      'note-markdown'));
    saveBttnEle.classList.add('notes-closed');
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
  const targEleCL = evt.target.classList;
  const curTarg = evt.currentTarget;

  if (!allowEvt()) return;

  if (targEleCL.contains(targCls)) {
    const noteEles = curTarg.parentElement.getElementsByClassName(notesCls);

    for (const noteEle of noteEles) {
      if (noteEle === curTarg) continue;
      noteEle.classList.toggle('notes-closed');
    }

    if (this.showNote) {
      const noteCont = createEle(
        'div',
        [
          createEle('div', null, 'note-cont-body'),
          createEle('button', 'Save', [saveBttnCls, 'notes-closed'])
        ]
      );

      this.noteInfo.insert({ id: this.noteSubID }, noteCont);
      getOtherNotes(this);
    } else {
      this.noteInfo.closeSub({ id: this.noteSubID });
    }

    this.showNote = !this.showNote;
  } else if (targEleCL.contains(saveBttnCls)) {
    await saveOtherNotes(this, curTarg.querySelector(`.${targCls}`));
  } else if (this.noteInfo.getInfo.querySelector('.note-markdown')) {
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
        rows: '10',
        cols: '60',
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
      marked.parse(noteData)
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

  if (targCl.contains('qt-note-bttn-save')) {
    saveQuestNote(this);
  } else if (targCl.contains('qt-note-bttn-edit')) {
    toggleQuestNoteMode(this, true);
  } else if (targCl.contains('qt-note-regname')) {
    const noteCont = targEle.parentElement.querySelector('.qt-note-regcont');
    removeData(noteCont);
    noteCont.classList.toggle('notes-closed');

    if (!noteCont.classList.contains('notes-closed')) {
      toggleQuestNoteMode(this);
    }
  }
}

function openQuestNote(questNoteData, menuBttn) {
  const questNoteCont = createEle('div');

  if (questNoteData.length === 1) {
    const noteThisData = { menuBttn };
    noteThisData.cur = questNoteData[0];
    noteThisData.noteCont = questNoteCont;
    toggleQuestNoteMode(noteThisData);

    questNoteCont.addEventListener('click', questNoteEvents.bind(noteThisData));
  } else {
    for (const questNote of questNoteData) {
      const noteThisData = { menuBttn };

      const noteCont = createEle('div', null, ['qt-note-regcont', 'notes-closed']);
      const regNoteCont = createEle(
        'div',
        [
          createEle('div',
            document.createTextNode(questNote.region_name),
            'qt-note-regname',
            null, null),
          noteCont
        ]
      );

      noteThisData.cur = questNote;
      noteThisData.noteCont = noteCont;
      regNoteCont.addEventListener('click', questNoteEvents.bind(noteThisData));
      questNoteCont.appendChild(regNoteCont);
    }
  }

  return questNoteCont;
}

export { toggleOtherNotes, genNoteItem, openQuestNote };
