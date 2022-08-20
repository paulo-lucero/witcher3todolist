import { marked } from 'marked';
import { allowEvt, createEle, queryInfo, removeData, GenCustomFetchData } from './w3gdefs';
import { noteObj } from './w3gquestdata';
import { GenFetchInit } from './w3continfo';

// collapsible https://jsfiddle.net/45Lj3mc7/ https://marked.js.org/using_pro
const detailsTag = {
  name: 'detailsTag',
  level: 'block',
  start(src) { return src.match(/(?<=\n)\+(?=\++[^+\n]+\++)/)?.index; }, // https://jsfiddle.net/fncaq13z/5/
  tokenizer(src, tokens) {
    const consumeM = /^\++[^+\n]+\++\n[\S\s]+?\n\++/.exec(src);
    const summM = consumeM
      ? /(?<=\++)[^+\n]+(?=\++\n)/.exec(consumeM[0])
      : null;
    const bodyM = consumeM
      ? /(?<=\++[^+\n]+\++\n)[\S\s]+(?=\n\++)/.exec(consumeM[0])
      : null;
    if (consumeM && summM && bodyM) {
      const token = { // Token to generate
        type: 'detailsTag', // Should match "name" above
        raw: consumeM[0], // Text to consume from the source
        detailsBody: this.lexer.blockTokens(bodyM[0].trim()),
        text: summM[0].trim(), // Additional custom properties
        tokens: [] // Array where child inline tokens will be generated
      };
      this.lexer.inline(token.text, token.tokens); // Queue this data to be processed for inline tokens
      return token;
    }
  },
  renderer(token) {
    return `<details><summary>${this.parser.parseInline(token.tokens)}</summary>${this.parser.parse(token.detailsBody)}</details>`;
  }
};

/* e.g.

+++ Lorem ipsum +++
* Mauris bibendum gravida lorem ut aliqu
* Aliquam mattis tortor a auctor tempo
++++

+++ Lorem ipsum +++
* Mauris bibendum gravida lorem ut aliqu
* Aliquam mattis tortor a auctor tempo
++++

*/

marked.use({ extensions: [detailsTag] });

// notes
/**
 *
 * @param {Node|HTMLElement|Element} innerBody
 * @param {Boolean} qwStatus
 */
function applyPlayerStatus(innerBody, qwStatus) {
  const updaterEle = innerBody.querySelector('input');
  const qwtItemEles = Array.from(innerBody.getElementsByClassName('outer-note'));

  updaterEle.checked = !!qwStatus;
  if (qwStatus) {
    qwtItemEles.forEach(qwtItemEle => qwtItemEle.classList.add('player-done'));
  } else {
    qwtItemEles.forEach(qwtItemEle => qwtItemEle.classList.remove('player-done'));
  }
}

/**
 *
 * @param {Event} evt
 */
async function updatePlayerStatus(evt) {
  const targEle = evt.target;
  const noteBodyEle = targEle.parentElement;
  const newStatusBool = !this.status;
  const newQwStatus = +newStatusBool;

  const updateResult = await queryInfo('/query/update-player',
    new GenCustomFetchData(
      {
        allPlayers: false,
        status: newQwStatus,
        playerID: this.playerID
      }
    )
  );

  // console.log(updateResult);
  if (updateResult.modified !== 1) {
    throw new Error(`Number of modified rows is ${updateResult.modif_count}`);
  }

  this.status = newQwStatus;
  applyPlayerStatus(
    noteBodyEle,
    newStatusBool
  );
}

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
  const noteEntryEle = noteThis.noteCont.parentElement;
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

  if (noteThis.highLight) {
    if (notEmpty) {
      noteEntryEle.classList.add('has-note-player');
    } else {
      noteEntryEle.classList.remove('has-note-player');
    }
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

  if (targEleCL.contains(targCls)) {
    if (!allowEvt()) return;
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
    if (!allowEvt()) return;
    await saveOtherNotes(this);
  } else if (targEleCL.contains(editBttnCls)) {
    if (!allowEvt()) return;
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
  const isQt = noteThis.noteType === 'qt';

  if (noteData !== textValue) {
    if (!notEmpty) {
      textValue = null;
    }
    const updateData = {
      id: isQt ? curData.quest_id : null,
      regid: isQt ? curData.region_id : null,
      data: textValue,
      type: noteThis.noteType
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

    if (isQt) {
      const newMenuBttn = modif.result.no_notes
        ? noteObj.imgObjs.nt.cloneNode()
        : noteObj.imgObjs.add.cloneNode();

      noteThis.menuBttn.replaceChild(
        newMenuBttn,
        noteThis.menuBttn.firstElementChild
      );
    }
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

  const noteType = 'qt';

  if (questNoteData.length === 1) {
    const noteThisData = { menuBttn, noteType };
    noteThisData.cur = questNoteData[0];
    questNoteCont.classList.add('note-entry-cont-single');
    noteThisData.noteCont = questNoteCont;
    toggleQuestNoteMode(noteThisData);

    questNoteCont.addEventListener('click', questNoteEvents.bind(noteThisData));
  } else {
    for (const questNote of questNoteData) {
      const noteThisData = { menuBttn, noteType };

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

export {
  toggleOtherNotes,
  genNoteItem,
  openQuestNote,
  applyPlayerStatus,
  updatePlayerStatus,
  toggleQuestNoteMode,
  questNoteEvents
};
