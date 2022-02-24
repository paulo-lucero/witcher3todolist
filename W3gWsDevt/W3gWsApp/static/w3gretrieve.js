async function displayAffected(evt) {
  let sect = evt.currentTarget.parentElement;
  let kcData = notesData[menuNames.affName];
  let sameNote = closeNotes(sect.querySelector('ul'), sect.getElementsByClassName(kcData.noteClass)[0]);
  if (!sameNote) {
    let dataNotes = await queryInfo(kcData.queryUrl(this));
    let noteUl = document.createElement('ul');
    noteUl.className = kcData.noteClass;
    noteUl.appendChild(genNoteHeader(document.createElement('li'), 'span', kcData.noteHeaders)); // header
    for (let dataNote of dataNotes) {
      noteli = document.createElement('li');
      let itemClasses = kcData.noteItems;
      noteUl.appendChild(displayQueryData(new addtlNote(dataNote, dataNote.info, displayAffected,
                                                        showNotesOverlay, urlClass=itemClasses[0][0],
                                                        levelClass=itemClasses[1][0]),
                                            noteli));
    }
    sect.appendChild(noteUl)
  }
}

async function displayNote(evt) {
  let sameNote = closeNotes(notesDataContainer.querySelector('ul'), notesDataContainer.getElementsByClassName(this.noteClass)[0],
                            menuContainer=(notesDataContainer.hasChildNodes()) ? evt.currentTarget.parentElement : null);
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
    notesDataContainer.appendChild(noteUl);
    mainNotes.appendChild(notesDataContainer);
  }
}

function showNotesOverlay(evt) {
  let noteCount = 0;
  let firstNote;
  for (let [notesName, notesBool] of this.notes) {
    if (notesBool) {
      noteCount++;
      let kcData = notesData[notesName];
      let noteMenu = document.createElement('span');
      noteMenu.className = kcData.menuClass;
      noteMenu.innerHTML = notesName;
      kcData.dataId = this.dataId;
      noteMenu.addEventListener('click', displayNote.bind(kcData));
      notesMenuContainer.appendChild(noteMenu);
      if (noteCount === 1) {
        firstNote = noteMenu;
      }
    }
  }
  firstNote.click();
  mainNotes.appendChild(notesMenuContainer);
  guideBody.style.filter = 'blur(5px)';
  notesBody.style.display = 'flex';
}

function closeNotesOverlay(evt) {//closing overlay notes menu
  let openNotes = evt.target;
    //using "currentTarget", the target is always element with "qnotes-body" id, regardless where click event is dispatched
  if (openNotes.id === 'qnotes-body') {
    removeData([notesDataContainer, notesMenuContainer]);
    openNotes.style.display = 'none';
    guideBody.style.removeProperty('filter');
  }
}

function displayQueryData(questInfos, sect) {
  let mainClass = questInfos.sectItemClass;
  let noteMenuCls = questInfos.noteMenuCls;
  for (let [menuClass, menuData] of questInfos.fixedData) { // fixed data like questname and level
    if (menuData) {
      let sectItem = custom_createEle('span', null, eleCls=[mainClass, menuClass]);
      sectItem.appendChild(menuData);
      sect.appendChild(sectItem);
   }
  }
  for (let [noteObj, noteBool] of questInfos.dataNotes) { // notes, this data aren't fixed/expected always to have
    if (noteBool) {
      let sectItem = custom_createEle('span', inhtml=noteObj.menuName, eleCls=[mainClass, noteMenuCls]);
      sectItem.addEventListener('click', noteObj.eventFunc)
      sect.appendChild(sectItem);
    }
  }
  return sect
}

async function displayLevelData(evt) {//main and secondary quests with levels
  let noteId = this.lvlSectID;
  let sameNote = closeNotes(levelSection.firstChild, document.getElementById(noteId),
                            menuContainer=(levelSection.hasChildNodes()) ? evt.currentTarget.parentElement : null)
  if (!sameNote) {
    let noteBody = document.createElement('div');
    noteBody.id = noteId;
    noteBody.appendChild(genNoteHeader(document.createElement('div'), 'span', [ ['lvlheader-name', 'Quest Name'],
                                                                                ['lvlheader-lvl', 'Quest Level'],
                                                                                ['lvlheader-notes', 'Quest Notes'] ]));
    let queryLevel = await queryInfo(this.retUrl);
    for (let missionInfo of queryLevel) {
      noteBody.appendChild(displayQueryData(new addtlNote(missionInfo, missionInfo['info'],
                                                              displayAffected, showNotesOverlay),
                                                document.createElement('div')))
    }
    levelSection.appendChild(noteBody);
  }
}

async function levelQuery(evt) {
  let inputValue;
  if(Number.isInteger(evt)) {
    inputValue = evt;
  } else {
    if(evt.key === 'Enter') { //querying level
      inputValue = queryInput.value;
    } else {
      return
    }
  }
  let lvlCatStatus = await queryInfo(`/query/chklevel-${inputValue}`);
  if (levelMenu.hasChildNodes() && levelSection.hasChildNodes()) {
    removeData([levelSection, levelMenu]);
  }
  let noteCount = 0;
  let firstNote;
  for (let [lvlMenuName, lvlMenuId, lvlDataBool, lvlDataSect] of [ [ 'Main Quests', 'lvlmain-menu',
                                                                      lvlCatStatus.main, { lvlSectID: 'lvlsect-main',
                                                                      retUrl: `/query/mainlevel-${inputValue}` } ],
                                                                    [ 'Second Quests', 'lvlsec-menu',
                                                                      lvlCatStatus.second, { lvlSectID: 'lvlsect-sec',
                                                                      retUrl: `/query/seclevel-${inputValue}` } ] ]) {
                                                                    //enveloped in array, for ordered processing
    if (lvlDataBool) {
      noteCount++;
      let lvlMenuCont = document.createElement('span');
      lvlMenuCont.innerHTML = lvlMenuName;
      lvlMenuCont.id = lvlMenuId;
      lvlMenuCont.addEventListener('click', displayLevelData.bind(lvlDataSect))
      levelMenu.appendChild(lvlMenuCont);
      if (noteCount === 1) {
        firstNote = lvlMenuCont;
      }
    }
  }
  if (firstNote) { //check first if has notes
    firstNote.click();
  }
}

async function displayNlevelData(evt) {
  let regionSect = evt.currentTarget.parentElement;
  let regionId = this.regionId;
  let rBodyCls = this.rBodyCls;
  let regionBody = regionSect.getElementsByClassName(rBodyCls);
  if (regionBody.length !== 0) {
    closeNotes(regionBody[0], false)
  } else {
    let regionBody = custom_createEle('div', null, eleCls=rBodyCls);
    let nLvlInfos = await queryInfo(`/query/nlevel-rgid-${regionId}`);
    regionBody.appendChild(genNoteHeader(document.createElement('div'), 'span', [ ['nlvlheader-name', 'Quest Name'],
                                                                                  ['nlvlheader-notes', 'Quest Notes'] ]));
    for (let nLvlInfo of nLvlInfos) {
      regionBody.appendChild(displayQueryData(new addtlNote(nLvlInfo, nLvlInfo.info,
                                                            displayAffected, showNotesOverlay),
                                              document.createElement('div')));
    }
    regionSect.appendChild(regionBody);
  }
}

async function nLevelQuery() {
  let regionsInfos = await queryInfo('/query/nlevel-regions');
  for (let regionInfo of regionsInfos) {
    let regionCount = regionInfo.quest_count;
    let regionName = regionInfo.region_name;
    let regionSect = custom_createEle('div', null, eleCls='region-section');
    if (regionCount) {
      allQueryData[regionName] = regionCount;
    }
    let regionMenu = custom_createEle('div', null, eleCls='nlvl-title');
    for (let [rTitle, rCls] of [[regionName, 'region-name'], [regionCount, 'region-count']]) {
      regionMenu.appendChild(custom_createEle('span', rTitle, eleCls=rCls));
    }
    regionMenu.addEventListener('click', displayNlevelData.bind({regionId:regionInfo.id, rBodyCls:'nlvl-body'}));
    regionSect.appendChild(regionMenu);
    nlevelSection.appendChild(regionSect);
  }
}

levelQuery(1) //visiting the website; for now default query level is 1

nLevelQuery() //non leveled quests

queryInput.addEventListener('keyup', levelQuery);

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
