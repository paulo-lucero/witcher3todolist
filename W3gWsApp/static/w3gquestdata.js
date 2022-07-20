/* global
  inputVisibility,
  createEle,
  createUrl,
  displayAffected,
  showNotesOverlay,
  questMarking,
  showMultiQuest,
  showDataConfirm,
  InfoCont,
  QuestCont,
  CgRightSect,
  Updater,
  DataContxt
 */

function GenNoteIdentf(qw, em, nt) {
  this.qw = qw;
  this.em = em;
  this.nt = nt;
}

const noteObj = {
  names: new GenNoteIdentf('Missable', 'Enemies', 'Note'),
  queryFunc: new GenNoteIdentf(
    dataId => `/query/mis-id-${dataId}`,
    dataId => `/query/enm-id-${dataId}`,
    null
  ),
  menuCls: new GenNoteIdentf('qwt-menu', 'enm-menu'),
  noteCls: new GenNoteIdentf('qwt-note', 'enm-note'),
  header: new GenNoteIdentf(
    [
      ['qwtheader-name', 'Players'],
      ['qwtheader-location', 'Location'],
      ['qwtheader-notes', 'Notes']
    ],
    [
      ['enmheader-name', 'Enemies Name'],
      ['enmheader-notes', 'Notes']
    ]
  ),
  body: new GenNoteIdentf(
    [
      [
        'qwtitem-name',
        ['p_url', 'p_name']
      ],
      ['qwtitem-location', 'p_location'],
      ['qwtitem-notes', 'qwent_notes']
    ],
    [
      [
        'enmitem-name',
        ['enemy_url', 'enemy_name']
      ],
      ['enmitem-notes', 'enemy_notes']
    ]
  )
};

function menuClass(questInfo, cls = 'notes-data') {
  const defCls = [questInfo.cut ? 'cutoff-quest' : 'normal-quest'];
  return defCls.concat(cls);
}

function genNullNote(questInfo) {
  return createEle('span', 'n/a', menuClass(questInfo, 'qnotes-none'));
}

/**
 *
 * @param {Element|HTMLElement} menuCont element containing class "menu-cont"
 * @param {Element|HTMLElement} excl to be excluded
 */
function toggleQuestType(menuCont, excl) {
  const menus = menuCont.querySelectorAll(
    '.cutoff-quest, .normal-quest'
  );

  menus.forEach(
    menuEle => {
      if (excl === menuEle) return;
      menuEle.classList.toggle('cutoff-quest');
      menuEle.classList.toggle('normal-quest');
    }
  );
}

// quest data generation blueprints
function genMenuMarker(questInfo, evtRef, nonMulti = null) {
  const isMulti = (nonMulti === null || !nonMulti) &&
    'quest_count' in questInfo &&
    questInfo.quest_count > 1;
  const custAtr = Object.assign(
    isMulti ? evtRef.getRef : evtRef.getOtrRef(null, 'multi'),
    { 'data-id': questInfo.id },
    { 'data-qcount': 'quest_count' in questInfo ? questInfo.quest_count : 'n/a' }
  );
  if (!isMulti) Object.assign(custAtr, { type: 'checkbox' });
  const menuMarker = isMulti
    ? createEle(
      'span',
      document.createTextNode(questInfo.quest_count),
      menuClass(questInfo, ['mult-reg', 'info-marker']),
      null,
      custAtr
    )
    : createEle('input', null, ['quest-marker', 'info-marker', 'hidden-marker'], null, custAtr);
  if (isMulti) menuMarker.addEventListener('click', showMultiQuest);
  return menuMarker;
}

function genMenuRegNm(questInfo) {
  return createEle('span', `${questInfo.location || questInfo.region_name} :`, 'multi-rname');
}

function genMenuName(questInfo) {
  return createEle(
    'span',
    createUrl(
      questInfo.quest_url,
      questInfo.quest_name
    ),
    menuClass(questInfo, 'quest-data'));
}

function genMenuLvl(questInfo) {
  const hasLvl = !!questInfo.req_level;
  return createEle(
    'span',
    document.createTextNode(hasLvl ? questInfo.req_level : 'n/a'),
    menuClass(questInfo, hasLvl ? 'quest-level' : 'qlvl-none')
  );
}

function genMenuCut(questInfo, evtRef) {
  const custAtr = Object.assign(
    evtRef.getRef,
    { 'data-id': questInfo.id },
    { 'data-cutcount': questInfo.cut !== null ? questInfo.cut : 'n/a' }
  );
  let menuCut;
  if (questInfo.cut !== null && questInfo.cut >= 0) {
    const innerMenu = createEle(
      'span',
      document.createTextNode(questInfo.cut),
      null,
      null,
      custAtr);
    if (questInfo.cut > 0) {
      innerMenu.addEventListener('click', displayAffected);
    }
    menuCut = createEle('span', innerMenu, menuClass(questInfo));
  } else {
    menuCut = genNullNote(questInfo);
  }
  return menuCut;
}

function genMenuNote(questInfo) {
  const menuData = [
    ['qwt', 'qw'],
    ['enm', 'em']
  ];
  const menuEles = [];
  for (const [infoKey, menuKey] of menuData) {
    if (!(questInfo[infoKey])) continue;
    const innerMenu = createEle(
      'span',
      noteObj.names[menuKey],
      null,
      null,
      { 'data-notetype': menuKey });
    menuEles.push(
      createEle('span', innerMenu)
    );
  }
  let menuNote;
  if (menuEles.length >= 1) {
    menuNote = createEle(
      'span',
      menuEles,
      menuClass(questInfo),
      null,
      { 'data-id': questInfo.id });
    menuNote.addEventListener(
      'click',
      showNotesOverlay.bind(
        createEle(
          'h2',
          [
            createUrl(questInfo.quest_url, questInfo.quest_name),
            createEle(
              'span',
              document.createTextNode(questInfo.req_level ? questInfo.req_level : 'n/a')
            )
          ]
        )
      ));
  } else {
    menuNote = genNullNote(questInfo);
  }
  return menuNote;
}

function genMenuRegion(questInfo) {
  const menuRegion = createEle(
    'span',
    questInfo.region_name,
    null,
    null,
    null,
    { regid: questInfo.region_id });
  menuRegion.addEventListener('click', showDataConfirm);
  return createEle('span', menuRegion, menuClass(questInfo));
}

// filter generation
function genMarkerFilt(menuInfo, questInfo, genMultiFilt) {
  if (questInfo.is_multi && genMultiFilt) {
    const isMulti = 'quest_count' in questInfo && questInfo.quest_count > 1;
    const mfilt = isMulti
      ? { done: null }
      : { undone: null };
    Updater.genInfoFilt(
      menuInfo,
      Object.assign(mfilt, { quest: questInfo.id })
    );
  }
  return menuInfo;
}

/**
 *
 * Generate Quest Data
 * @param {Node|Element|HTMLElement} sect main container element of all quest data
 * @param {JSON} questInfo querried data in json format
 * @param {DataContxt} contxtRef DataContxt obj
 * @param {string} mode could be 'all', 'noreg', 'sec' and 'multi'
 * @returns {Node|Element|HTMLElement}
 */
function consoQueryData(sect, questInfo, contxtRef, mode = 'all', genMultiFilt = true, forceMultiInfo = false) {
  const multiMode = mode === 'multi';
  const noReg = mode === 'noreg' || mode === 'sec';
  const finMode = mode === 'marked';
  const dataId = questInfo.id;
  const infoReg = 'region_id' in questInfo ? questInfo.region_id : null;
  const qrStr = `q${dataId}r${infoReg}`;
  const multiIdRef = contxtRef.createId(qrStr, 'multi'); // attached the id even if not multi
  const questIdRef = contxtRef.createId(qrStr, 'gen');
  const menuData = [
    [
      genMenuMarker(questInfo, multiIdRef, (mode === 'sec' || multiMode) || null), 'marker'
    ],
    [
      multiMode ? genMenuRegNm(questInfo) : null, 'regname'
    ],
    [
      genMenuName(questInfo), 'questname'
    ],
    [
      !multiMode && !finMode ? genMenuLvl(questInfo) : null, 'lvl'
    ],
    [
      !multiMode && !finMode ? genMenuCut(questInfo, questIdRef) : null, 'cut'
    ],
    [
      !multiMode && !finMode ? genMenuNote(questInfo) : null, 'note'
    ],
    [
      !multiMode && !finMode && !noReg ? genMenuRegion(questInfo) : null, 'reg'
    ]
  ];
  const menuCont = createEle('div', null, 'menu-cont');
  for (const [ele, type] of menuData) {
    if (ele === null) continue;
    const menuInfo = createEle('span', ele, type);
    if (type === 'cut' && questInfo.cut !== null) {
      Updater.genInfoFilt(
        menuInfo,
        { cutoff: questInfo.id }
      );
    } else if (type === 'marker' && !multiMode) {
      genMarkerFilt(menuInfo, questInfo, genMultiFilt);
    }
    menuCont.appendChild(menuInfo);
  }
  const infoCont = new InfoCont(
    null,
    { id: multiIdRef.getId, class: 'sub-multi' },
    { id: questIdRef.getId, class: 'sub-gen' }
  );
  sect.append(menuCont, infoCont.getInfo);
  sect.classList.add('quest-container');
  if (questInfo.is_multi && !multiMode) sect.classList.add('multi-info');
  if (multiMode) sect.classList.add('sub-multi-info');
  sect.dataset.info = `${dataId}#${forceMultiInfo && questInfo.is_multi ? 1 : infoReg}#${questInfo.req_level}`;
  sect.addEventListener('mouseenter', inputVisibility);
  sect.addEventListener('mouseleave', inputVisibility);
  sect.addEventListener('click', questMarking);
  return sect;
  // attached the questMarking on the sect
}

function genNoteHeader(headersData) {
  const containerEle = createEle('div', null, 'quest-header');
  for (const headerD of headersData) { // header
    if (!headerD) continue;
    const [hClass, hName] = headerD;
    const noteSpan = document.createElement('span');
    noteSpan.classList.add(hClass);
    noteSpan.appendChild(
      document.createTextNode(hName)
    );
    containerEle.appendChild(noteSpan);
  }
  return containerEle;
}

function questHeaderAry(mode = 'all') {
  const finMode = mode === 'marked';
  const noReg = mode === 'noreg' || mode === 'sec';
  const headersData = [
    mode === 'multi' ? ['headers-regname', 'Region Name'] : null,
    ['headers-questname', 'Quest Name'],
    mode !== 'multi' && !finMode ? ['headers-questlvl', 'Level'] : null,
    mode !== 'multi' && !finMode ? ['headers-affected', 'Affected'] : null,
    mode !== 'multi' && !finMode ? ['headers-notes', 'Notes'] : null,
    mode !== 'multi' && !finMode && !noReg
      ? ['headers-regquest', 'Reqion Quests']
      : null
  ];

  return headersData;
}

/**
 *
 * @param {{Str:String}} contAttr for setting attributes
 * @param {String} eleType type of element for containing the quest data elements
 * @param {Array|Object} infosData in json format
 * @param {DataContxt} contxtRef
 * @param {String} mode 'all', 'multi' or 'noreg'
 * @returns {QuestCont}
 */
function displayQuestData(contAttr, eleType, infosData, contxtRef, mode = 'all') {
  // if infoCont is a function, infoData will be passed to it and it should return an element where the infoData will be appended

  let questObj;
  if (Array.isArray(contAttr)) {
    questObj = new QuestCont(
      null,
      ...contAttr
    );
  } else {
    questObj = new QuestCont(
      null,
      contAttr
    );
  }

  questObj.setHeader(
    genNoteHeader(
      questHeaderAry(mode)
    )
  );

  for (const infoData of infosData) {
    const questCont = document.createElement(eleType);
    questObj.insert(consoQueryData(questCont, infoData, contxtRef, mode));
  }

  return questObj;
}

/**
 *
 * @param {{Str:String}|[{Str:String}]} contAttr for setting attributes
 * @param {String} mode 'all', 'multi' or 'noreg'
 * @returns {QuestCont}
 */
function genQuestCont(contAttr, mode = 'all') {
  let questObj;
  if (Array.isArray(contAttr)) {
    questObj = new QuestCont(
      null,
      ...contAttr
    );
  } else {
    questObj = new QuestCont(
      null,
      contAttr
    );
  }

  questObj.setHeader(
    genNoteHeader(
      questHeaderAry(mode)
    )
  );

  return questObj;
}

class FormattedQuest {
  #sect;
  #restPar;

  /**
   *
   * @param {String} typeQ "aff", "sec"
   * @param {DataContxt|HTMLElement|Element|String} pContxt
   * @param {string} cContxt
   */
  constructor(typeQ, pContxt, cContxt) {
    const defInfoCls = 'qinfo';

    let curContxt;
    let questCls;
    if (typeQ === 'aff') {
      curContxt = new DataContxt(pContxt, `cut${cContxt}`);
      questCls = new DataContxt(curContxt, defInfoCls).newContxt;
      this.#sect = ['div', null, questCls];
      this.#restPar = [curContxt, 'noreg', true];
    } else if (typeQ === 'sec') {
      curContxt = new DataContxt(pContxt, `regid${cContxt}`);
      questCls = new DataContxt(curContxt, defInfoCls).newContxt;
      this.#sect = ['div', null, questCls];
      this.#restPar = [curContxt, 'sec', false];
    } else if (typeQ === 'cruc') {
      curContxt = new DataContxt(pContxt, `lvl${cContxt}`);
      this.#sect = ['div', null, CgRightSect.questCls];
      this.#restPar = [curContxt, 'noreg', true];
    } else if (typeQ === 'reg') {
      curContxt = new DataContxt(pContxt, `reg${cContxt}`);
      this.#sect = ['div', null, CgRightSect.questCls];
      this.#restPar = [curContxt, 'sec', false];
    } else if (typeQ === 'multi') {
      curContxt = new DataContxt(pContxt, `multiq${cContxt}`);
      questCls = new DataContxt(curContxt, defInfoCls).newContxt;
      this.#sect = ['div', null, questCls];
      this.#restPar = [curContxt, 'multi', true];
    }
  }

  get questCls() {
    return this.#sect[2];
  }

  genQuestData(questInfo, forceMultiInfo = false) {
    return consoQueryData(
      createEle(...this.#sect),
      questInfo,
      ...this.#restPar,
      forceMultiInfo
    );
  }
}
