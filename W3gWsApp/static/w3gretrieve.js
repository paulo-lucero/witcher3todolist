/* global
    testQuestData,
    inputData,
    noteConts,
    markData,
    CgRightSect,
    createEle,
    createUrl,
    retreiveNull,
    queryInfo,
    allowEvt,
    genQueryData,
    consoQueryData,
    QuestCont,
    removeData,
    closeNotes,
    GenFetchInit,
    hasQuests,
    undsplyEle,
    stylng,
    genNoteHeader,
    createRightInfo,
    genQuestCont,
    InfoCont,
    CgLSect,
    isSameRqt,
    createLSect,
    DataContxt
 */

async function displayAffected(evt) {
  if (!allowEvt()) return;
  const sect = evt.currentTarget.parentElement.parentElement;
  const noteContCls = 'affected-note';
  const curNote = sect.querySelector('ul');
  /* global contsM */
  const wasClosed = contsM.closeCont(curNote);
  if (!wasClosed) return;
  const dataNotes = await queryInfo(`/query/aff-id-${this.valueOf()}`);
  if (!dataNotes) return;
  const noteUl = contsM.openCont('ul', false, { cutoff: this.valueOf() }, null, null, noteContCls);
  noteUl.appendChild(genNoteHeader(document.createElement('li'), 'span', 4)); // header
  for (const dataNote of dataNotes) {
    const noteli = document.createElement('li');
    noteUl.appendChild(genQueryData(dataNote, noteli, 5, null, true));
  }
  sect.appendChild(noteUl);
}

async function displayNote(evt) {
  if (allowEvt()) {
    const sameNote = closeNotes(
      noteConts.nData.querySelector('ul'),
      noteConts.nData.getElementsByClassName(this.noteClass)[0],
      (noteConts.nData.hasChildNodes())
        ? evt.currentTarget.parentElement
        : null);
    if (!sameNote) {
      const dataNotes = await queryInfo(this.queryUrl(this.dataId));
      const noteUl = document.createElement('ul');
      noteUl.className = this.noteClass;
      noteUl.appendChild(genNoteHeader(document.createElement('li'), 'span', this.noteHeaders)); // header
      for (const dataNote of dataNotes) {
        const noteli = document.createElement('li');
        for (const [dataClass, dataKey] of this.noteItems) {
          const noteSpan = document.createElement('span');
          noteSpan.className = dataClass;
          if (Array.isArray(dataKey)) { // processing url data
            noteSpan.appendChild(createUrl(dataNote[dataKey[0]], dataNote[dataKey[1]]));
          } else {
            noteSpan.appendChild(document.createTextNode(dataNote[dataKey]));
          }
          noteli.appendChild(noteSpan);
        }
        noteUl.appendChild(noteli);
      }
      noteConts.nData.appendChild(noteUl);
    }
  }
}

function showNotesOverlay(evt) {
  if (allowEvt()) {
    for (const headerNote of this.headers) {
      if (headerNote) {
        const headerEle = document.createElement('span');
        headerEle.appendChild(headerNote);
        noteConts.nHeader.appendChild(headerEle);
      }
    }
    for (const [notesName, notesBool] of this.notes) {
      if (notesBool) {
        /* global notesData */
        const kcData = notesData[notesName];
        const noteMenu = document.createElement('span');
        noteMenu.className = kcData.menuClass;
        noteMenu.innerHTML = notesName;
        kcData.dataId = this.dataId;
        noteMenu.addEventListener('click', displayNote.bind(kcData));
        noteConts.nMenus.appendChild(noteMenu);
      }
    }
    noteConts.nMenus.firstChild.click();
    noteConts.overlayOn(true);
  }
}

function closeNotesOverlay(evt) { // closing overlay notes menu
  const openNotes = evt.target;
  // using "currentTarget", the target is always element with "qnotes-body" id, regardless where click event is dispatched
  if (openNotes.id === 'qnotes-body') {
    if (allowEvt('allow-select')) {
      removeData([noteConts.nHeader, noteConts.nData, noteConts.nMenus]);
      noteConts.overlayOn(false);
      markData.showDone(false);
    }
  }
}

async function showDataConfirm(evt) {
  if (allowEvt()) {
    if (this.show) {
      CgRightSect.regionId = this.regionId;
      if (CgRightSect.regionId !== this.regionId) {
        throw new Error(`Not same region id: info obj - ${CgRightSect.regionId} | region id - ${this.regionId}`);
      }
      const chckHasQuest = cateBody => hasQuests(cateBody);
      for (let indx = 0; indx < CgRightSect.infoMenus.length - 1; indx++) {
        const openedNote = CgRightSect.cateConts[indx].some(chckHasQuest);
        if (openedNote) {
          CgRightSect.opnCrl.appendChild(createEle('div', CgRightSect.infoMenus[indx].innerHTML));
        }
      }
      if (CgRightSect.opnCrl.hasChildNodes()) {
        stylng(noteConts.w3, 'filter', 'blur(5px)');
        stylng(CgRightSect.conBody, 'display', 'flex');
      } else {
        CgRightSect.bttnConf.click();
      }
    } else {
      if (stylng(CgRightSect.conBody, 'display') !== 'none') {
        stylng(CgRightSect.conBody, 'display', 'none');
        stylng(noteConts.w3, 'filter', false);
      }
      if (this.confirm) {
        const questInfos = await queryInfo(`/query/second-quests-regid-${CgRightSect.regionId}`);
        CgRightSect.infoRefresh(true, false);
        if (questInfos === null) {
          CgRightSect.infoRegion.appendChild(retreiveNull());
        } else {
          CgRightSect.infoRegion.appendChild(genNoteHeader(document.createElement('div'), 'span', 4));
          for (const questInfo of questInfos) {
            CgRightSect.infoRegion.appendChild(genQueryData(questInfo, document.createElement('div'), 5));
          }
        }
        CgRightSect.infoRefresh();
      }
      removeData(CgRightSect.opnCrl);
    }
  }
}
/* global IdRef */
async function displayRegionSect(evt) {
  if (!allowEvt()) return;
  const regMenu = evt.currentTarget;
  const regContRef = IdRef.getIdRef(regMenu);
  const regionId = parseInt(regMenu.dataset.region, 10);
  const regIdentf = `regid${regionId}`;
  const regCls = CgLSect.questCls.concat('-', regIdentf); // identifier for quest infos under a certain region, could bind the region body element in the event listener
  if (InfoCont.isOpen({ id: regContRef })) { // removing the opened region quests container
    InfoCont.updateInfos(
      document.getElementsByClassName(regCls)
    );
    return;
  }

  const questInfos = await queryInfo(`/query/second-quests-regid-${regionId}`);
  if (questInfos === null) {
    const nullEle = retreiveNull();
    nullEle.classList.add(regCls);
    InfoCont.insertData(
      { id: regContRef },
      nullEle
    );
    return;
  }
  const regContxt = new DataContxt(regMenu, `regid${regionId}`);
  const regQuestCont = new QuestCont(null);
  for (const questInfo of questInfos) {
    const questSect = consoQueryData(
      createEle('div', null, regCls),
      questInfo,
      regContxt,
      'noreg'
    );
    regQuestCont.insert(questSect);
  }
  InfoCont.insertData(
    { id: regContRef },
    regQuestCont.main,
    regQuestCont.body
  );
}

async function questSectMenu(evt) {
  const menuTarg = evt.target;
  if (!allowEvt() || !(menuTarg.classList.contains(CgLSect.menuCls))) return;
  const sameNote = isSameRqt(evt);
  if (sameNote) return;

  const sectMenu = evt.currentTarget;
  const subID = IdRef.getIdRef(sectMenu);
  const isMain = menuTarg.id === CgLSect.mainId;
  const sectContxt = new DataContxt(sectMenu, isMain ? 'main' : 'sec');
  if (isMain) {
    const questInfos = await queryInfo('/query/main-quests-info');
    if (questInfos === null) {
      CgLSect.infoObj.insert(
        { id: subID },
        retreiveNull()
      );
      return;
    }
    const questCont = testQuestData(null, 'div', questInfos, sectContxt);
    CgLSect.infoObj.insert(
      { id: subID },
      questCont.main,
      questCont.body
    );
  } else {
    const regionInfos = await queryInfo('/query/regions-info');
    const regionCont = createEle('div', null, 'qsec-body');
    for (const regionInfo of regionInfos) {
      const lRegRef = new DataContxt(sectContxt, 'lreg').createId(regionInfo.id);
      const regionMenu = createEle(
        'div',
        [
          createEle('span', regionInfo.region_name, 'region-name'),
          createEle('span', regionInfo.quest_count, 'quest-count')
        ],
        'region-menu',
        null,
        lRegRef.getRef,
        { region: regionInfo.id }
      );
      regionMenu.addEventListener('click', displayRegionSect);
      const regionBody = new InfoCont(
        { class: 'region-body' },
        { id: lRegRef.getId }
      );
      const regionSect = createEle('div', [regionMenu, regionBody.getInfo], 'region-sect');
      regionCont.appendChild(regionSect);
    }
    CgLSect.infoObj.insert(
      { id: subID },
      regionCont
    );
  }
}

async function retreiveCrucialData(queryLevel) {
  const infoQuests = document.getElementsByClassName(CgRightSect.questCls);
  InfoCont.updateInfos(infoQuests);

  const qCrucialInfos = await queryInfo(`/query/crucial-quests-qrylvl-${queryLevel}`);
  CgRightSect.recentLvl = queryLevel;
  const infoEle = CgRightSect.infoObj;

  const hRiskBasis = queryLevel - 5;
  const lRiskBasis = queryLevel - 2;
  const qConts = {};
  for (const qCrucialInfo of qCrucialInfos) {
    const questLevel = qCrucialInfo.req_level;
    const questCate = qCrucialInfo.category_id;
    const cateIndx = questCate === 4
      ? null
      : CgRightSect.order(questCate);
    const typeData = questCate === 4
      ? 1
      : questLevel === hRiskBasis
        ? 2
        : questLevel <= lRiskBasis && questLevel > hRiskBasis
          ? 3
          : questLevel < hRiskBasis
            ? 4
            : null;
    if (typeData === null) continue;
    let typeRef = CgRightSect.refs[typeData];
    typeRef = typeof typeRef === 'string'
      ? typeRef
      : CgRightSect.refs[typeData][cateIndx];
    let qCont;
    if (!(typeRef in qConts)) {
      qCont = genQuestCont(null, 'noreg');
      qConts[typeRef] = qCont;
    } else {
      qCont = qConts[typeRef];
    }
    qCont.insert(consoQueryData(
      createEle('div', null, CgRightSect.questCls),
      qCrucialInfo,
      new DataContxt(typeRef, `lvl${queryLevel}`),
      'noreg'
    ));
  }

  const qContsData = Object.entries(qConts);

  if (qContsData.length === 0) {
    const nullContnt = createEle(
      'div',
      `No Crucial Quests Data for level: ${queryLevel}`,
      CgRightSect.questCls);
    infoEle.insert(
      { id: CgRightSect.refs[0] },
      nullContnt
    );
    return;
  };

  for (const [idCont, qCont] of qContsData) {
    infoEle.insert(
      { id: idCont },
      qCont.main,
      qCont.body
    );
  }
}

function inputLvlQuery(evt) {
  if (allowEvt()) {
    const curValue = inputData.inputEle.value;
    const indexExpt = curValue.search(/E|e/);
    const parsedValue = indexExpt !== -1
      ? parseFloat(curValue.slice(0, indexExpt))
      : parseFloat(curValue);
    inputData.inputEle.value = parsedValue > 0 ? Math.floor(parsedValue) : 1;
    const eleTarget = evt.currentTarget;
    let queryValue = parseInt(inputData.inputEle.value);
    if (eleTarget === inputData.arrowUp) {
      inputData.inputEle.value = queryValue = queryValue + 1;
    } else if (eleTarget === inputData.arrowDown) {
      inputData.inputEle.value = queryValue = queryValue - 1;
    } else if (evt.key !== 'Enter') {
      return;
    }
    retreiveCrucialData(queryValue);
  }
}

async function showMultiQuest(evt) {
  if (!allowEvt()) return;
  const questDataCont = evt.currentTarget.parentElement;
  const multiDataCont = questDataCont.querySelector('.multi-notes');
  const questId = parseInt(evt.currentTarget.dataset.id, 10);
  // sameNote = closeNotes([multiDataCont], multiDataCont.hasChildNodes());
  const wasClosed = true; // contsM.closeCont(multiDataCont, true);
  if (wasClosed) {
    const multiInfos = await queryInfo(`/query/qst-id-${questId}`);
    if (multiInfos.length === 0) return;
    // contsM.openCont(multiDataCont, true, {quest:questId});
    for (const multiInfo of multiInfos) {
      const innerCont = document.createElement('div');
      const questLoc = createEle('span', `${multiInfo.location} :`, 'multi-rname');
      multiDataCont.appendChild(genQueryData(multiInfo, innerCont, 2));
      // console.log(innerCont.children[1]);
      innerCont.insertBefore(questLoc, innerCont.children[1]);
    }
  }
  undsplyEle([multiDataCont]);
}

function questSelection(dataCont) {
  const isSelected = 'selected' in dataCont.dataset ? JSON.parse(dataCont.dataset.selected) : false;
  dataCont.dataset.selected = !isSelected;
  dataCont.querySelector('.quest-marker').checked = !isSelected;
}

async function questMarking(evt) {
  if (!allowEvt('allow-select')) return;
  const selectedQuest = evt.currentTarget.parentElement;
  const dataConts = Array.from(document.querySelectorAll(`[data-info="${selectedQuest.dataset.info}"]`));
  dataConts.forEach(questSelection);
  if (markData.selectOn) {
    markData.selectRefrh();
    // return;
  }
  // await contsM.update();
}

async function showQuestsDone(evt) {
  if (!allowEvt()) return;
  if (evt.target === document.getElementById('done-display')) {
    markData.showDone(true);
    noteConts.overlayOn(true);
    document.getElementById('done-menu').firstElementChild.click();
  } else {
    const bttnsData = [
      {
        bttn: markData.recentBttn,
        mode: 'recent'
      },
      {
        bttn: markData.allBttn,
        mode: 'all'
      }
    ];
    const currCont = markData.doneDataCont;
    const regConts = Array.from(currCont.querySelectorAll('[data-regid]'));
    const notEmpty = regConts.some(regCont => hasQuests(regCont));
    const queryData = {};
    for (const bttnData of bttnsData) {
      if (evt.target !== bttnData.bttn || (currCont.dataset.mode === bttnData.mode && notEmpty)) continue;
      // if clicked menu and current menu is not same OR (current menu opened AND has quest data)
      queryData[bttnData.mode] = Date.now();
      const doneData = await queryInfo('/query/request-modif', new GenFetchInit(null, null, queryData));
      // console.log(notEmpty);
      if (notEmpty || (!notEmpty && currCont.hasChildNodes())) removeData(currCont);
      if (!doneData || doneData.length === 0) {
        currCont.appendChild(retreiveNull());
        return;
      }
      let currReg = null;
      for (const doneQuest of doneData) {
        if (!currReg || parseInt(currReg.dataset.regid, '10') !== doneQuest.region_id) {
          currReg = createEle('div', doneQuest.region_name, null, null, { 'data-regid': doneQuest.region_id });
          currCont.appendChild(currReg);
        }
        currReg.appendChild(genQueryData(doneQuest, document.createElement('div'), 2));
      }
      currCont.dataset.mode = bttnData.mode;
      break;
    }
  }
}

async function redoAllQuest(evt) {
  if (!allowEvt()) return;
  const dataConts = markData.doneDataCont.querySelectorAll('[data-info]');
  dataConts.forEach(questSelection);
  // await contsM.update(true);
}

function inputVisibility(evt) {
  if (!markData.selectOn) {
    const questMarker = evt.target.querySelector('.quest-marker');
    const evtType = evt.type;
    if (evtType === 'mouseenter' && questMarker) {
      questMarker.style.setProperty('visibility', 'revert');
    } else if (evtType === 'mouseleave' && questMarker) {
      questMarker.style.setProperty('visibility', 'hidden');
    }
  }
}

async function selectMode(evt) {
  if (!allowEvt('allow-select')) return;
  const selectData = {
    selBttn: markData.doneMode ? markData.selectBttn : markData.doneSelect,
    canBttn: markData.doneMode ? markData.cancelBttn : markData.doneCancel,
    markMsg: markData.doneMode ? 'Done' : 'Undone',
    dataSect: markData.doneMode ? noteConts.w3 : markData.doneDataCont
  };
  if (markData.selectOn && evt.target !== selectData.canBttn && markData.selectRefrh()) {
    // await contsM.update();
  } else if (markData.selectOn && evt.target === selectData.canBttn) {
    const dataConts = document.querySelectorAll('[data-selected="true"]');
    if (dataConts.length !== 0) {
      dataConts.forEach(
        function(dataCont) {
          dataCont.querySelector('.quest-marker').checked = false;
          delete dataCont.dataset.selected;
        }
      );
    }
  }
  markData.selectOn = !markData.selectOn;
  selectData.selBttn.innerHTML = markData.selectOn ? selectData.markMsg : 'Select Quest';
  markData.selectRefrh();
  selectData.dataSect.classList.toggle('select-on');
  selectData.canBttn.style.setProperty('display', markData.selectOn ? 'inline-block' : 'none');
  // when selectOn change to false, all checked input should be unchecked
}

async function initGuide() {
  noteConts.nBody.addEventListener('click', closeNotesOverlay);

  // CgRightSect.bttnConf.addEventListener('click', showDataConfirm.bind({show:false, confirm:true}));
  // CgRightSect.bttnCanl.addEventListener('click', showDataConfirm.bind({show:false, confirm:false}));

  // markData.selectBttn.addEventListener('click', selectMode);
  // markData.cancelBttn.addEventListener('click', selectMode);
  // document.getElementById('done-display').addEventListener('click', showQuestsDone);
  // markData.doneSelect.addEventListener('click', selectMode);
  // markData.doneCancel.addEventListener('click', selectMode);
  // document.getElementById('undone-all').addEventListener('click', redoAllQuest);

  // markData.recentBttn.addEventListener('click', showQuestsDone);
  // markData.allBttn.addEventListener('click', showQuestsDone);

  await createLSect();
  createRightInfo();
}

initGuide();

// TODO:
//  -!!
//   -improve memory management?
//    -use a function that return the constant(functions, like inputData.inputEle, levelSection & etc)
//  -Problem:
//   -switching animation between missable and enemies notes aren't smooth
//    -possible cause: when the prev note is remove, the "space" which the prev note reside will also dissapper
//    -possible solution: this can be solve with animation
//   -memory usage seems do not decrease regardless of length of query result

// =Notes=
// -as much as possible separate the javascript code from html
//  -e.g. use element.onclick = function; instead of onclick="javascript code"
// -for adding eventlistener in every loop
//  -define a function outside of loop, so one reference will be made on all function made (good for memory)
// -in case: if wanted to change(e.g. display none) a certain element when an another element receive an event, use .querySelector()
//  -e.g. document.querySelector(div span[style:"display:block;"])
