function closeNotes(parentE, noteClass, menuContainer=null) {
  let noteUl = parentE.querySelector('ul');
  let noteStat = (parentE.getElementsByClassName(noteClass)[0]) ? true : false; // if same note return true
  if(menuContainer && ((menuContainer.children.length === 1) || noteStat)) { //if single note found or same, don't allowed to close it
    return true
  }
  if (noteUl) {
    parentE.removeChild(noteUl);
  }
  return noteStat
}

async function displayAffected(evt) {
  let sect = evt.currentTarget.parentElement;
  let kcData = notesData[menuNames.affName];
  let sameNote = closeNotes(sect, kcData.noteClass);
  if (!sameNote) {
    let dataNotes = await queryInfo(kcData.queryUrl(this));
    let noteUl = document.createElement('ul');
    noteUl.className = kcData.noteClass;
    noteUl.appendChild(genNoteHeader(document.createElement('li'), 'span', kcData.noteHeaders)); // header
    for (let dataNote of dataNotes) {
      noteli = document.createElement('li');
      let itemClasses = kcData.noteItems;
      noteUl.appendChild(displayLevelData(new addtlNote(dataNote, dataNote.info, displayAffected,
                                                        showNotesOverlay, urlClass=itemClasses[0][0],
                                                        levelClass=itemClasses[1][0]),
                                            noteli));
    }
    sect.appendChild(noteUl)
  }
}

async function displayNote(evt) {
  let sect = document.getElementById('qnotes-data');
  let sameNote = false;
  let notesInfos;
  if (sect) {
    sameNote = closeNotes(sect, this.noteClass, menuContainer=evt.currentTarget.parentElement);
    notesInfos = sect;
  } else {
    notesInfos = document.createElement('div');
    notesInfos.id = 'qnotes-data';
  }
  if (!sameNote) {
    let dataNotes = await queryInfo(this.queryUrl(this.dataId));
    let noteUl = document.createElement('ul');
    noteUl.className = this.noteClass;
    noteUl.appendChild(genNoteHeader(document.createElement('li'), 'span', this.noteHeaders)); // header
    for (let dataNote of dataNotes) {
      noteli = document.createElement('li');
      for (let [dataClass, dataKey] of this.noteItems) {
        let noteSpan = document.createElement('span');
        noteSpan.className = dataClass;
        if (Array.isArray(dataKey)) {//processing url data
          noteSpan.appendChild(createUrl(dataNote[dataKey[0]], dataNote[dataKey[1]]));
        } else {
          noteSpan.appendChild(document.createTextNode(dataNote[dataKey]))
        }
        noteli.appendChild(noteSpan);
      }
      noteUl.appendChild(noteli);
    }
    notesInfos.appendChild(noteUl);
    mainNotes.appendChild(notesInfos);
  }
}

function showNotesOverlay(evt) {
  let guideBody = document.getElementById('w3g-body');
  let notesMenus = document.createElement('div');
  notesMenus.id = 'qnotes-menus';
  let noteCount = 0;
  for (let [notesName, notesBool] of this.notes) {
    if (notesBool) {
      noteCount++;
      let kcData = notesData[notesName];
      let noteMenu = document.createElement('span');
      noteMenu.className = kcData.menuClass;
      noteMenu.innerHTML = notesName;
      kcData.dataId = this.dataId;
      noteMenu.addEventListener('click', displayNote.bind(kcData));
      notesMenus.appendChild(noteMenu);
      if (noteCount === 1) {
        noteMenu.click();
      }
    }
  }
  mainNotes.appendChild(notesMenus);
  guideBody.style.filter = 'blur(5px)';
  notesBody.style.display = 'flex';
}

function closeNotesOverlay(evt) {//closing overlay notes menu
  let guideBody = document.getElementById('w3g-body');
  let openNotes = evt.target;
    //using "currentTarget", the target is always element with "qnotes-body" id, regardless where click event is dispatched
  if (openNotes.id === 'qnotes-body') {
    while(mainNotes.firstChild) {
        mainNotes.removeChild(mainNotes.firstChild);
    }
    openNotes.style.display = 'none';
    guideBody.style.removeProperty('filter');
  }
}

function displayLevelData(questInfos, sect) {
  let innerSect = () => document.createElement('span'); //arrow function support in steam overlay browser is uncertain
  let mainClass = questInfos.sectItemClass;
  for (let [menuClass, menuData] of questInfos.fixedData) { // fixed data like questname and level
    let sectItem = innerSect();
    sectItem.classList.add(mainClass, menuClass);
    sectItem.appendChild(menuData);
    sect.appendChild(sectItem);
  }
  for (let [noteObj, noteBool] of questInfos.dataNotes) { // notes, this data aren't fixed/expected always to have
    if (noteBool) {
      let sectItem = innerSect();
      sectItem.classList.add(mainClass, 'mLvlAddtl-menu');
      sectItem.innerHTML = noteObj.menuName;
      sectItem.addEventListener('click', noteObj.eventFunc)
      sect.appendChild(sectItem);
    }
  }
  return sect
}

async function retMissionInfo(queryValue) {
  dataMissionInfo = await queryInfo(`/query/level-${queryValue}`);
  if (levelSection.hasChildNodes()) {
    while(levelSection.firstChild) {
      levelSection.removeChild(levelSection.firstChild);
    }
  }
  for (let dataMission of dataMissionInfo) {
    levelSection.appendChild(displayLevelData(new addtlNote(dataMission, dataMission['info'],
                                                            displayAffected, showNotesOverlay),
                                              document.createElement('div')))
  }
}

function missionQuery(evt) {
  if(evt.key === 'Enter') {
    retMissionInfo(queryInput.value)
  }
}

retMissionInfo(1) //opening of the website

queryInput.addEventListener('keyup', missionQuery);

notesBody.addEventListener('click', closeNotesOverlay);

// TODO:
//  -!!
//   -improve memory management?
//    -use a function that return the constant(functions, like queryInput, levelSection & etc)
//  -Problem:
//   -switching animation between missable and enemies notes aren't smooth
//    -possible cause: when the prev note is remove, the "space" which the prev note reside will also dissapper
//    -possible solution: this can be solve with animation
//   -memory usage seems do not decrease regardless of length of query result

//=Notes=
// -as much as possible separate the javascript code from html
//  -e.g. use element.onclick = function; instead of onclick="javascript code"
// -for adding eventlistener in every loop
//  -define a function outside of loop, so one reference will be made on all function made (good for memory)
// -in case: if wanted to change(e.g. display none) a certain element when an another element receive an event, use .querySelector()
//  -e.g. document.querySelector(div span[style:"display:block;"])
