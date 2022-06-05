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
