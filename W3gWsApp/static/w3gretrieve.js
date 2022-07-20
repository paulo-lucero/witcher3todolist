/* global
    displayQuestData,
    inputData,
    CgRightSect,
    createEle,
    createUrl,
    retreiveNull,
    queryInfo,
    allowEvt,
    consoQueryData,
    removeData,
    GenFetchInit,
    createRightInfo,
    genQuestCont,
    InfoCont,
    CgLSect,
    isSameRqt,
    createLSect,
    DataContxt,
    setupOverlays,
    QuestCont,
    noteObj,
    CgOverlay,
    openOverlay,
    Updater,
    FormattedQuest
 */

/**
 *
 * @param {Event} evt
 */
async function displayAffected(evt) {
  if (!allowEvt()) return;

  const cutMenu = evt.currentTarget;
  const cutRef = IdRef.getIdRef(cutMenu);
  const questId = parseInt(cutMenu.dataset.id, 10);
  const cutQuests = new FormattedQuest('aff', cutMenu, questId);
  const cutQuestCls = cutQuests.questCls;

  if (InfoCont.isOpen({ id: cutRef })) {
    InfoCont.removeData(
      document.getElementsByClassName(cutQuestCls)
    );
    return;
  }

  const dataNotes = await queryInfo(`/query/aff-id-${questId}`);
  if (dataNotes.length === 0) {
    const nullEle = retreiveNull();
    nullEle.classList.add(cutQuestCls);
    InfoCont.insertData(
      { id: cutRef },
      nullEle
    );
    return;
  }

  const questCont = genQuestCont(
    [
      { class: 'affected-note' },
      null,
      Updater.genContFilt(
        null,
        { cutoff: questId }
      )
    ],
    'noreg'
  );

  for (const dataNote of dataNotes) {
    const questInfo = cutQuests.genQuestData(dataNote);
    questCont.insert(questInfo);
  }
  InfoCont.insertData(
    { id: cutRef },
    questCont.main,
    questCont.body
  );
}

async function displayNote(evt) {
  const evtTarg = evt.target;
  const noteType = 'menutype' in evtTarg.dataset
    ? evtTarg.dataset.menutype
    : null;
  if (!noteType || !allowEvt()) return;

  if (isSameRqt(evt)) return;

  const dataNotes = await queryInfo(
    noteObj.queryFunc[noteType](CgOverlay.curQuestID)
  );

  const noteCont = new QuestCont(
    null,
    { class: noteObj.noteCls[noteType] }
  );

  const headerCont = createEle('div');
  for (const [hCls, hName] of noteObj.header[noteType]) {
    const headerEle = createEle(
      'span',
      document.createTextNode(hName),
      hCls
    );
    headerCont.appendChild(headerEle);
  }
  noteCont.setHeader(headerCont);

  function createNote(lk, lnm) {
    return createEle('span', document.createTextNode(lnm));
  }

  for (const dataNote of dataNotes) {
    const bodyEle = createEle('div');
    for (const [bCls, bName] of noteObj.body[noteType]) {
      bodyEle.appendChild(
        createEle(
          'span',
          Array.isArray(bName)
            ? createUrl(dataNote[bName[0]], dataNote[bName[1]], createNote)
            : dataNote[bName]
              ? createNote(null, dataNote[bName])
              : createEle('span', 'n/a', 'qnotes-none'),
          bCls
        )
      );
    }
    noteCont.insert(bodyEle);
  }

  InfoCont.insertData(
    { id: 'qnotes-data' },
    noteCont.main,
    noteCont.body
  );
}

/**
 *
 * @param {Event} evt
 */
function showNotesOverlay(evt) {
  const evtTarg = evt.target;
  const menuTarg = 'notetype' in evtTarg.dataset
    ? evtTarg
    : null;
  if (!menuTarg || !allowEvt()) return;

  const typeTarg = evtTarg.dataset.notetype;

  const curT = evt.currentTarget;
  CgOverlay.curQuestID = curT.dataset.id;
  const noteCont = new QuestCont(null);
  noteCont.setHeader(this);
  noteCont.main.classList.add('overlay-notes');

  const noteInfo = new InfoCont(
    { class: CgOverlay.ovlCls },
    { id: 'qnotes-data' }
  );
  const menuCont = createEle('div');
  const noteMenus = {};
  for (const menuD of curT.querySelectorAll('[data-notetype]')) {
    const noteType = menuD.dataset.notetype;
    const noteNmBlp = noteObj.names;
    if (!(noteType in noteNmBlp)) continue;
    const noteMenu = createEle(
      'span',
      noteNmBlp[noteType],
      noteObj.menuCls[noteType],
      null,
      null,
      { menutype: noteType }
    );
    menuCont.appendChild(noteMenu);
    noteMenus[noteType] = noteMenu;
  }

  menuCont.addEventListener('click', displayNote);
  noteInfo.addHeader(menuCont);
  noteCont.insert(noteInfo.getInfo);

  openOverlay(
    { id: CgOverlay.noteID },
    noteCont.main,
    noteCont.body
  );

  const clickEvt = new Event('click', { bubbles: true });

  noteMenus[typeTarg].dispatchEvent(clickEvt);
}

async function displayRegionQuests(regID) {
  CgOverlay.curRegID = regID;
  InfoCont.removeData(
    document.getElementsByClassName(CgRightSect.questCls)
  );
  const questInfos = await queryInfo(`/query/second-quests-regid-${regID}`);
  Updater.genContFilt(
    CgRightSect.infoObj.getInfo,
    { second: null, region: regID }
  );
  if (questInfos.length === 0) {
    CgRightSect.infoObj.insert(
      { id: CgRightSect.refs[0] },
      createEle(
        'div',
        'No Data Available',
        CgRightSect.questCls
      )
    );
    return;
  }
  const regRef = CgRightSect.refs[5];
  const regQuest = new FormattedQuest('reg', regRef, regID);
  const questCont = genQuestCont(null, 'noreg');

  for (const questInfo of questInfos) {
    const questEle = regQuest.genQuestData(questInfo);
    questCont.insert(questEle);
  }
  CgRightSect.infoObj.insert(
    { id: regRef },
    questCont.main,
    questCont.body
  );
}

/**
 *
 * @param {Event} evt
 */
function confirmProc(evt) {
  if (!allowEvt()) return;
  const curTg = evt.currentTarget;
  const confStat = curTg.value;
  if (confStat === 'confirm') {
    displayRegionQuests(parseInt(curTg.dataset.regid, 10));
  }
  const confOvly = document.getElementById(
    CgOverlay.curOpenID
  );
  const clkEvt = new Event('click', { bubbles: true });
  confOvly.dispatchEvent(clkEvt);
}

/**
 *
 * @param {Event} evt
 */
function showDataConfirm(evt) {
  if (!allowEvt()) return;
  const regID = parseInt(evt.currentTarget.dataset.regid, 10); // should set current region id only, when confirmed not every click event
  const openedCruc = CgRightSect.infoObj.getOpenAll(
    CgRightSect.crucHeadCls
  );
  if (openedCruc.length === 0) {
    displayRegionQuests(regID);
    return;
  };

  const confirmCont = new QuestCont(
    null,
    { class: 'overlay-confirm' }
  );

  confirmCont.setHeader(
    createEle('h2', 'Opened Crucial Notes:')
  );

  for (const header of openedCruc) {
    confirmCont.insert(
      createEle(
        'div',
        header.innerText,
        CgOverlay.ovlCls
      )
    );
  }

  const confirmBttns = [];
  for (const [bttnNm, bttnType] of [['Confirm', 'confirm'], ['Cancel', 'cancel']]) {
    const confBttn = createEle(
      'button',
      bttnNm,
      null,
      null,
      { value: bttnType },
      { regid: regID }
    );
    confBttn.addEventListener('click', confirmProc);
    confirmBttns.push(confBttn);
  }
  confirmCont.setFooter(
    createEle('div', confirmBttns)
  );

  openOverlay(
    { id: CgOverlay.confirmID },
    confirmCont.main,
    confirmCont.body
  );
}
/* global IdRef */
async function displayRegionSect(evt) {
  const regMenu = evt.currentTarget;
  const questCount = parseInt(regMenu.dataset.regcount, 10);

  if (questCount === 0 || !allowEvt()) return;
  const regContRef = IdRef.getIdRef(regMenu);
  const regionId = parseInt(regMenu.dataset.region, 10);
  const regQuest = new FormattedQuest('sec', regMenu, regionId);
  const regCls = regQuest.questCls; // identifier for quest infos under a certain region, could bind the region body element in the event listener
  if (InfoCont.isOpen({ id: regContRef })) { // removing the opened region quests container
    InfoCont.removeData(
      document.getElementsByClassName(regCls)
    );
    return;
  }

  const questInfos = await queryInfo(`/query/second-quests-regid-${regionId}`);
  if (questInfos.length === 0) {
    const nullEle = retreiveNull();
    nullEle.classList.add(regCls);
    InfoCont.insertData(
      { id: regContRef },
      nullEle
    );
    return;
  }
  const regQuestCont = genQuestCont(
    [
      null,
      null,
      Updater.genContFilt(
        null,
        {
          second: null,
          region: regionId
        }
      )
    ], 'sec');
  for (const questInfo of questInfos) {
    const questSect = regQuest.genQuestData(questInfo);
    regQuestCont.insert(questSect);
  }
  InfoCont.insertData(
    { id: regContRef },
    regQuestCont.main,
    regQuestCont.body
  );
}

function genRegCountEle(regCount, regID) {
  return createEle(
    'span',
    document.createTextNode(regCount),
    'quest-count',
    null,
    Updater.genOthrFilt(null, { sreg: regID })
  );
}

async function questSectMenu(evt) {
  const menuTarg = evt.target;
  if (!(menuTarg.classList.contains(CgLSect.menuCls)) || !allowEvt()) return;
  const sameNote = isSameRqt(evt);
  if (sameNote) return;

  const sectMenu = evt.currentTarget;
  const subID = IdRef.getIdRef(sectMenu);
  const isMain = menuTarg.id === CgLSect.mainId;
  const sectContxt = new DataContxt(sectMenu, isMain ? 'main' : 'sec');
  if (isMain) {
    const questInfos = await queryInfo('/query/main-quests-info');
    if (questInfos.length === 0) {
      CgLSect.infoObj.insert(
        { id: subID },
        Updater.genContFilt(
          retreiveNull(),
          { main: null }
        )
      );
      return;
    }
    const questCont = displayQuestData(
      [
        null,
        null,
        Updater.genContFilt(
          null,
          { main: null }
        )
      ],
      'div',
      questInfos,
      sectContxt);
    CgLSect.infoObj.insert(
      { id: subID },
      questCont.main,
      questCont.body
    );
  } else {
    const regionInfos = await queryInfo('/query/regions-info');
    const regionCont = createEle('div', null, 'qsec-body');
    for (const regionInfo of regionInfos) {
      const questCount = regionInfo.quest_count;
      const regID = regionInfo.id;
      const lRegRef = new DataContxt(sectContxt, 'lreg').createId(regID);
      const regionMenu = createEle(
        'div',
        [
          createEle('span', document.createTextNode(regionInfo.region_name), 'region-name'),
          genRegCountEle(questCount, regID)
        ],
        'region-menu',
        null,
        lRegRef.getRef,
        { region: regID, regcount: questCount }
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
  InfoCont.removeData(infoQuests);

  const qCrucialInfos = await queryInfo(`/query/crucial-quests-qrylvl-${queryLevel}`);
  CgRightSect.recentLvl = queryLevel;
  const infoEle = CgRightSect.infoObj;

  Updater.genContFilt(
    infoEle.getInfo,
    { cruc: queryLevel }
  );

  const hRiskBasis = queryLevel - 5;
  const lRiskBasis = queryLevel - CgRightSect.exclLvlR;
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
    qCont.insert(
      new FormattedQuest('cruc', typeRef, queryLevel).genQuestData(qCrucialInfo)
    );
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
  const curTarg = evt.currentTarget;
  const questID = curTarg.dataset.id;
  const subRef = IdRef.getIdRef(curTarg);
  const multiQuest = new FormattedQuest('multi', subRef, questID);
  const questCls = multiQuest.questCls;

  if (InfoCont.isOpen({ id: subRef })) {
    InfoCont.removeData(
      document.getElementsByClassName(questCls)
    );
    return;
  }

  const multiInfos = await queryInfo(`/query/qst-id-${questID}`);
  if (multiInfos.length === 0) return;
  const questCont = genQuestCont(
    [
      null,
      null,
      Object.assign(
        {},
        { class: 'multi-contnr' },
        Updater.genContFilt(
          null,
          { quest: parseInt(questID, 10) }
        )
      )
    ],
    'multi'
  );
  for (const multiInfo of multiInfos) {
    const questEle = multiQuest.genQuestData(multiInfo);
    questCont.insert(questEle);
  }
  InfoCont.insertData(
    { id: subRef },
    questCont.main,
    questCont.body
  );
}

function inputVisibility(evt) {
  const isRedoInfo = evt.currentTarget.classList.contains('finished-info');
  if ((CgOverlay.overlayOn && !isRedoInfo) || Updater.selectOn) return;
  const questMarker = evt.target.querySelector('.quest-marker');
  const evtType = evt.type;
  if (evtType === 'mouseenter' && questMarker) {
    questMarker.classList.remove('hidden-marker');
  } else if (evtType === 'mouseleave' && questMarker) {
    questMarker.classList.add('hidden-marker');
  }
}

function toggleSelect(dataCont) {
  dataCont.classList.toggle('info-selected');
}

function toggleCheck(dataCont) {
  const infoMarker = dataCont.querySelector('.info-marker');
  if (infoMarker.classList.contains('quest-marker')) {
    infoMarker.checked = !(infoMarker.checked);
  }
}

function questSelection(dataCont) {
  toggleSelect(dataCont);
  toggleCheck(dataCont);
}

/**
 *
 * @param {Event} evt
 */
async function questMarking(evt) {
  const curTarg = evt.currentTarget;
  const targ = evt.target;
  const curMarker = curTarg.querySelector('.info-marker');
  const isMarked = curMarker.classList.contains('quest-marker') &&
    curMarker === targ;
  // if (isMarked) {
  //   console.log({ curT: curTarg, tar: evt.target, mark: curMarker });
  // }
  if (!isMarked || !allowEvt('allow-select')) return;
  toggleCheck(curTarg); // to reverse the input checked to false
  const dataConts = Array.from(document.querySelectorAll(`[data-info="${curTarg.dataset.info}"]`));
  dataConts.forEach(questSelection);
  if (!Updater.selectOn) await Updater.update();
}

/**
 *
 * @param {Event} evt
 */
async function showQuestsDone(evt) {
  const targ = evt.target;
  if (!targ.classList.contains('finished-bttns') ||
    !allowEvt('allow-select') ||
    isSameRqt(evt)) return;

  const finishedBody = document.getElementById('finished-body');
  removeData(finishedBody);

  const questInfos = await queryInfo(
    '/query/request-modif',
    new GenFetchInit(null, null, null, null,
      targ.id === 'recently-finished' ? Date.now() : true,
      false
    )
  );

  const nullContID = { id: 'finished-null-cont' };
  const finishedInfo = new InfoCont({ id: 'finished-body-cont' }, nullContID);
  finishedBody.appendChild(finishedInfo.getInfo);

  if (questInfos.length === 0) {
    const nullCont = retreiveNull();
    // console.log(nullCont.innerHTML);
    finishedInfo.insert(
      nullContID,
      nullCont,
      nullCont
    );
    return;
  }

  // every per region create and reuse infocont
  let curRegID;
  let curRegInfo;
  let curRegCont;
  let curInfoID;
  let curContxt;
  for (const questInfo of questInfos) {
    const regID = questInfo.region_id;
    if (curRegID !== regID) {
      curInfoID = { id: `finished-reg-${regID}` };
      curRegCont = genQuestCont(null, 'marked');

      curRegInfo = new InfoCont(null, curInfoID);
      finishedInfo.appendInfo(curRegInfo);
      curRegInfo.addHeader(createEle('div', questInfo.region_name));
      curRegInfo.insert(
        curInfoID,
        curRegCont.main,
        curRegCont.body
      );

      curContxt = new DataContxt(null, `finishedquests${regID}`);
      curRegID = regID;
    }
    curRegCont.insert(
      consoQueryData(
        createEle('div', null, 'finished-info'),
        questInfo,
        curContxt,
        'marked',
        false
      )
    );
  }
}

/**
 *
 * @param {Event} evt
 */
function finishedOverlay(evt) {
  if (!allowEvt()) return;

  const doneOverlay = new QuestCont(null, { id: 'overlay-finished' });

  const redoBttns = createEle(
    'div',
    [
      createEle(
        'span',
        [
          createEle(
            'span',
            'Select',
            ['select', 'button', 'toggle-bttn']
          ),
          createEle(
            'span',
            'Mark',
            ['mark', 'button', 'hide-button', 'toggle-bttn']
          )
        ],
        'left-buttons'
      ),
      createEle(
        'span',
        [
          createEle(
            'span',
            'Redo All',
            ['redo-all', 'button']
          ),
          createEle(
            'span',
            'Cancel',
            ['cancel', 'button', 'hide-button', 'toggle-bttn']
          )
        ],
        'right-buttons'
      )
    ],
    null,
    'finished-buttons'
  );
  redoBttns.addEventListener('click', buttonsMangr);

  const doneMenus = createEle(
    'div',
    [
      createEle(
        'span',
        'Recently',
        'finished-bttns',
        'recently-finished'
      ),
      createEle(
        'span',
        'All',
        'finished-bttns',
        'all-finished'
      )
    ],
    null,
    'finished-overlay-menu'
  );

  doneMenus.addEventListener('click', showQuestsDone);

  doneOverlay.setHeader(redoBttns);
  doneOverlay.insert(
    createEle(
      'div',
      [
        doneMenus,
        createEle(
          'div',
          null,
          null,
          'finished-body'
        )
      ],
      CgOverlay.ovlCls
    )
  );

  openOverlay(
    { id: CgOverlay.finishedID },
    doneOverlay.main,
    doneOverlay.body
  );

  const firstEvt = new Event('click', { bubbles: true });
  doneMenus.querySelector(':first-child.finished-bttns').dispatchEvent(firstEvt);
}

/**
 *
 * @param {Event} evt
 */
async function buttonsMangr(evt) {
  const curTag = evt.currentTarget;
  const targClss = evt.target.classList;
  if (targClss.contains('finished')) {
    Updater.isDone = false;
    finishedOverlay(evt);
  } else if (targClss.contains('redo-all')) {
    redoAllQuest();
  } else if (targClss.contains('toggle-bttn')) {
    const bttns = curTag.querySelectorAll('.button');
    for (const bttn of bttns) {
      bttn.classList.toggle('hide-button');
    }

    const isSelect = targClss.contains('select');
    const isMark = targClss.contains('mark');
    const isCancel = targClss.contains('cancel');

    if (isSelect || isMark || isCancel) {
      if (InfoCont.isOpen(CgOverlay.infoObj)) {
        CgOverlay.infoObj.getInfo.classList.toggle('select-on');
      } else {
        document.getElementById('w3g-body').classList.toggle('select-on');
      }

      Updater.selectOn = !Updater.selectOn;
    }

    if (isMark) {
      await Updater.update();
    } else if (isCancel) {
      const selectedInfo = document.getElementsByClassName('quest-container info-selected');
      Array.from(selectedInfo).forEach(questSelection);
    }
  }
}

async function redoAllQuest() {
  if (!allowEvt()) return;
  const dataConts = document.querySelectorAll('.finished-info[data-info]');
  dataConts.forEach(questSelection);
  if (!Updater.selectOn) await Updater.update();
}

async function initGuide() {
  setupOverlays();
  await createLSect();
  await createRightInfo();

  document.getElementById('quest-query-left').addEventListener('click', buttonsMangr);
}

initGuide();
