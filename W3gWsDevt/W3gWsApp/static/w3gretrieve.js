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
                                                        showNotesOverlay, showDataConfirm,
                                                        urlClass=itemClasses[0][0], levelClass=itemClasses[1][0]),
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
  }
}

function showNotesOverlay(evt) {
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
      notesMenuContainer.appendChild(noteMenu);
    }
  }
  notesMenuContainer.firstChild.click();
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

async function showDataConfirm(evt) {
  if (this.show) {
    infoSectInfos.regionId = this.regionId;
    if (!(infoSectInfos.regionId === this.regionId)) {
      throw `Not same region id: info obj - ${infoSectInfos.regionId} | region id - ${this.regionId}`
    }
    if (infoSectInfos.getInfo('body', notIncl=[ovrLdBody, miniInfoBody]).some(infoBody => infoBody.hasChildNodes())) {
      let showTitle = (infoMenu) => {
        infoSectInfos.opnCrl.appendChild(custom_createEle('div', infoMenu.innerHTML, 'title-crucial'))
      }
      infoSectInfos.getInfo('menu', notIncl=[ovrLdMenu, miniInfoMenu]).forEach(showTitle);
      stylng(guideBody, 'filter', 'blur(5px)');
      stylng(infoSectInfos.conBody, 'display', 'flex')
    } else {
      infoSectInfos.bttnConf.click();
    }
  } else {
    if (stylng(infoSectInfos.conBody, 'display') !== 'none') {
      stylng(infoSectInfos.conBody, 'display', 'none');
      stylng(guideBody, 'filter', false)
    }
    if (this.confirm) {
      removeData(infoSectInfos.getInfo('body'));
      let questInfos = await queryInfo(`/query/second-quests-regid-${infoSectInfos.regionId}`)
      for (let questInfo of questInfos) {
        miniInfoBody.appendChild(displayQueryData(new addtlNote(questInfo, questInfo.info, displayAffected, showNotesOverlay, showDataConfirm),
                                                  document.createElement('div')));
      }
      undsplyEle(infoSectInfos.getInfo('sect'));
    }
    removeData(infoSectInfos.opnCrl)
  }
}

async function retreiveQuestData(evt) {
  let qNoteClass = this.qBodyClass;
  let checkSameNote = this.checkSameNote;
  let dataContainer = this.dataContainer;
  let sameNote = closeNotes([dataContainer], checkSameNote ? document.querySelector(`.${qNoteClass}`) : dataContainer.hasChildNodes(),
                            menuContainer = checkSameNote ? (dataContainer.hasChildNodes() ? pageQuestMenu : null) : null);

  if (!sameNote) {
    let questInfos = await queryInfo(this.urlQuery);
    dataContainer.className = qNoteClass;
    for (let questInfo of questInfos) {
      dataContainer.appendChild(displayQueryData(new addtlNote(questInfo, questInfo.info, displayAffected,
                                                               showNotesOverlay, showDataConfirm), document.createElement('div')));
    }
  }
}

async function retreiveRegionData(evt) {
  let qNoteClass = this.qBodyClass;
  let sameNote = closeNotes([pageQuestBody], document.querySelector(`.${qNoteClass}`),
                            menuContainer = pageQuestBody.hasChildNodes() ? pageQuestMenu : null);
  if(!sameNote) {
    let regionInfos = await queryInfo(this.urlQuery);
    pageQuestBody.className = qNoteClass;
    for (let regionInfo of regionInfos) {
      let rBodyCls = 'region-body';
      let regionMenu = custom_createEle('div', [
        custom_createEle('span', regionInfo.region_name, eleCls='region-name'),
        custom_createEle('span', regionInfo.quest_count, eleCls='quest-count')
      ], eleCls='region-menu');
      let regionBody = custom_createEle('div', null, eleCls=rBodyCls);
      regionMenu.addEventListener('click', retreiveQuestData.bind({
        qBodyClass: rBodyCls,
        checkSameNote: false,
        dataContainer: regionBody,
        urlQuery: `/query/second-quests-regid-${regionInfo.id}`
      }));
      let regionSect = custom_createEle('div', [regionMenu, regionBody], eleCls='region-sect');
      pageQuestBody.appendChild(regionSect);
    }
  }
}

async function checkQuestsStatus() {
  let menusData = [
    [
      'main',
      'Main Quests',
      'qmain-menu',
      retreiveQuestData,
      {
        urlQuery: '/query/main-quests-info',
        qBodyClass: 'qmain-body',
        dataContainer: pageQuestBody,
        checkSameNote: true
      }
    ],
    [
      'second',
      'Second Quests',
      'qsec-menu',
      retreiveRegionData,
      {
        urlQuery: '/query/regions-info',
        qBodyClass: 'qsec-body',
      }
    ]
  ];
  let questsStatus = await queryInfo('/query/check-quests-info');
  for (let [questCat, qMenuName, qMenuClass,menuFunc, bindData] of menusData) {
    if (questsStatus[questCat]) {
      let menuEle = custom_createEle('span', qMenuName, eleCls=qMenuClass);
      menuEle.addEventListener('click', menuFunc.bind(bindData));
      pageQuestMenu.appendChild(menuEle);
    }
  }
  pageQuestMenu.firstChild.click();
}

async function retreiveCrucialData(evt) {
  if (evt.key !== 'Enter') {
    return
  }
  let queryLevel = parseInt(queryInput.value);
  let qCrucialInfos = await queryInfo(`/query/crucial-quests-qrylvl-${queryLevel}`);
  removeData(infoSectInfos.getInfo('body'));
  if (qCrucialInfos) {
    let hRiskBasis = queryLevel - 5;
    let lRiskBasis = queryLevel - 2;
    for (let qCrucialInfo of qCrucialInfos) {
      let questInfo = qCrucialInfo.info;
      let questLevel = questInfo.r_level;
      let scvgList = [questInfo.category_id === 4, scvgBody];
      let highList = [!scvgList[0] && hRiskBasis === questLevel, hRiskBody];
      let lowList = [!scvgList[0] && !highList[0] && (questLevel <= lRiskBasis && questLevel > hRiskBasis), lRiskBody];
      let ovrLdList = [!scvgList[0] && !highList[0] && !lowList[0] && questLevel < hRiskBasis, ovrLdBody];
      for (let [statusBool, infoBody] of [scvgList, highList, lowList, ovrLdList]) {
        if (statusBool) {
          infoBody.appendChild(displayQueryData(new addtlNote(qCrucialInfo, questInfo, displayAffected, showNotesOverlay, showDataConfirm),
                                                document.createElement('div')));
          break
        }
      }
    }
  }
  undsplyEle(infoSectInfos.getInfo('sect'));
}

checkQuestsStatus();

notesBody.addEventListener('click', closeNotesOverlay);

queryInput.addEventListener('keyup', retreiveCrucialData);

infoSectInfos.bttnConf.addEventListener('click', showDataConfirm.bind({show:false, confirm:true}));
infoSectInfos.bttnCanl.addEventListener('click', showDataConfirm.bind({show:false, confirm:false}));

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
