import {
  inputVisibility,
  displayAffected,
  showNotesOverlay,
  questMarking,
  showMultiQuest,
  showDataConfirm,
  showPlayersOverlay
} from './w3gevtltnrs';

import { createEle, createUrl, CgRightSect } from './w3gdefs';
import { InfoCont, QuestCont, Updater } from './w3continfo';
import { DataContxt } from './w3gcontxt';

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
    dataId => `/query/quest-note-id-${dataId}`
  ),
  noteQuery: new GenNoteIdentf(
    dataId => `/query/mis-note-id-${dataId}`,
    dataId => `/query/enm-note-id-${dataId}`
  ),
  menuCont: 'note-menu',
  menuCls: new GenNoteIdentf('qwt-menu', 'enm-menu', 'qt-menu'),
  noteCls: new GenNoteIdentf('qwt-note', 'enm-note', 'qt-note'),
  headerCont: new GenNoteIdentf('qwtheader', 'enmheader'),
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
  bodyCont: new GenNoteIdentf('qwtitem', 'enmitem'),
  body: new GenNoteIdentf(
    [
      [
        'qwtitem-name',
        ['p_url', 'p_name']
      ],
      ['qwtitem-location', 'p_location'],
      ['qwtitem-notes', 'has_notes', true]
    ],
    [
      [
        'enmitem-name',
        ['enemy_url', 'enemy_name']
      ],
      ['enmitem-notes', 'has_notes', true]
    ]
  ),
  noteUpdate: new GenNoteIdentf('qwt', 'enm', null),
  imgObjs: {}
};

for (const [iconKey, iconUrl] of
  [
    ['qw', '/static/playing-cards-icon.png'],
    ['em', '/static/sword-icon.png'],
    ['add', '/static/plus-small.png'],
    ['nt', '/static/info.png'],
    ['reg', '/static/direction-road-sign-icon.png']
  ]) {
  const imgObj = new Image();
  imgObj.src = iconUrl;
  imgObj.classList.add('gentd-icon');
  noteObj.imgObjs[iconKey] = imgObj;
}

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
function genMenuMarker(questInfo, evtRef, allowMulti = true) {
  const isMulti = allowMulti &&
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
    ['enm', 'em'],
    ['no_notes', 'nt']
  ];
  const menuEles = [];
  let questNoteMenu;
  for (const [infoKey, menuKey] of menuData) {
    const isNote = infoKey === 'no_notes';
    const hasNote = questInfo[infoKey];
    if (!hasNote && !isNote) continue;
    const innerMenu = createEle(
      'span',
      isNote && !hasNote
        ? noteObj.imgObjs.add.cloneNode()
        : noteObj.imgObjs[menuKey].cloneNode(),
      null,
      null,
      { 'data-notetype': menuKey });
    if (isNote) {
      questNoteMenu = innerMenu;
    }
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
      showNotesOverlay.bind({
        header: createEle(
          'h2',
          [
            createUrl(questInfo.quest_url, questInfo.quest_name),
            createEle(
              'span',
              document.createTextNode(questInfo.req_level ? questInfo.req_level : 'n/a')
            )
          ]
        ),
        questNoteMenu
      }
      ));
  } else {
    menuNote = genNullNote(questInfo);
  }
  return menuNote;
}

function genMenuRegion(questInfo) {
  const menuRegion = noteObj.imgObjs.reg.cloneNode();
  menuRegion.dataset.regid = questInfo.region_id;
  menuRegion.addEventListener('click', showDataConfirm.bind(questInfo.region_name));

  if ('non_miss_players' in questInfo && questInfo.non_miss_players) {
    const menuPlayers = noteObj.imgObjs.qw.cloneNode();
    menuPlayers.addEventListener('click', showPlayersOverlay.bind({
      regID: questInfo.region_id,
      regName: questInfo.region_name
    }));

    return createEle('span', [menuPlayers, menuRegion], menuClass(questInfo), null, { title: questInfo.region_name });
  }

  return createEle('span', menuRegion, menuClass(questInfo), null, { title: questInfo.region_name });
}

// filter generation
function genMarkerFilt(menuInfo, questInfo) {
  if ('is_multi' in questInfo && questInfo.is_multi) {
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
 * @param {string} mode could be 'main', 'sec', 'aff', 'cruc', 'multi' and 'marked'
 * @returns {Node|Element|HTMLElement}
 */
function consoQueryData(sect, questInfo, contxtRef, mode = 'main') {
  const mainMode = !!(mode.match(/main/));
  const multiMode = !!(mode.match(/multi/));
  const allowMulti = !!(mode.match(/main|aff|cruc/));
  const allowNotes = !!(mode.match(/sec|aff|cruc/)) || mainMode;
  const isMultiInfo = allowMulti && questInfo.is_multi;

  const dataId = questInfo.id;
  const infoReg = 'region_id' in questInfo ? questInfo.region_id : null;
  const qrStr = `q${dataId}r${infoReg}`;
  const multiIdRef = contxtRef.createId(qrStr, 'multi'); // attached the id even if not multi
  const questIdRef = contxtRef.createId(qrStr, 'gen');
  const menuData = [
    [
      genMenuMarker(questInfo, multiIdRef, allowMulti), 'marker'
    ],
    [
      multiMode ? genMenuRegNm(questInfo) : null, 'regname'
    ],
    [
      genMenuName(questInfo), 'questname'
    ],
    [
      allowNotes ? genMenuLvl(questInfo) : null, 'lvl'
    ],
    [
      allowNotes ? genMenuCut(questInfo, questIdRef) : null, 'cut'
    ],
    [
      allowNotes ? genMenuNote(questInfo) : null, 'note'
    ],
    [
      mainMode ? genMenuRegion(questInfo) : null, 'reg'
    ]
  ];

  const styleHeader = mode.match(/main|sec|aff|cruc|marked/)
    ? ['all-cont']
    : ['multi-cont'];

  styleHeader.push('menu-cont');

  const menuCont = createEle('div', null, styleHeader);
  for (const [ele, type] of menuData) {
    if (ele === null) continue;
    const menuInfo = createEle('span', ele, type);
    if (type === 'cut' && questInfo.cut !== null) {
      Updater.genInfoFilt(
        menuInfo,
        { cutoff: questInfo.id }
      );
    } else if (type === 'marker' && allowMulti) {
      genMarkerFilt(menuInfo, questInfo);
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
  if (isMultiInfo) sect.classList.add('multi-info');
  if (multiMode) sect.classList.add('sub-multi-info');
  sect.dataset.info = `${dataId}#${isMultiInfo && questInfo.quest_count > 1 ? 1 : infoReg}#${questInfo.req_level}`;
  sect.addEventListener('mouseenter', inputVisibility);
  sect.addEventListener('mouseleave', inputVisibility);
  sect.addEventListener('click', questMarking);
  return sect;
}

function genNoteHeader(headersData, mode = 'all') {
  const styleHeader = mode.match(/main|sec|aff|cruc|marked/)
    ? ['all-cont']
    : ['multi-cont'];
  styleHeader.push('quest-header');
  const containerEle = createEle('div', null, styleHeader);
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
  const mainMode = !!(mode.match(/main/));
  const allowNotes = !!(mode.match(/sec|aff|cruc/)) || mainMode;
  const multiMode = !!(mode.match(/multi/));

  const headersData = [
    multiMode ? ['headers-regname', 'Region Name'] : null,
    ['headers-questname', 'Quest Name'],
    allowNotes ? ['headers-questlvl', 'Level'] : null,
    allowNotes ? ['headers-affected', 'Affected'] : null,
    allowNotes ? ['headers-notes', 'Notes'] : null,
    mainMode ? ['headers-regquest', 'Reqion Quests'] : null
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
function displayQuestData(contAttr, eleType, infosData, contxtRef, mode = 'main') {
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

  questObj.main.classList.add('type-quest-cont');

  questObj.setHeader(
    genNoteHeader(
      questHeaderAry(mode),
      mode
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

  questObj.main.classList.add('type-quest-cont');

  questObj.setHeader(
    genNoteHeader(
      questHeaderAry(mode),
      mode
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
      this.#restPar = [curContxt, 'aff'];
    } else if (typeQ === 'sec') {
      curContxt = new DataContxt(pContxt, `regid${cContxt}`);
      questCls = new DataContxt(curContxt, defInfoCls).newContxt;
      this.#sect = ['div', null, questCls];
      this.#restPar = [curContxt, 'sec'];
    } else if (typeQ === 'cruc') {
      curContxt = new DataContxt(pContxt, `lvl${cContxt}`);
      this.#sect = ['div', null, CgRightSect.questCls];
      this.#restPar = [curContxt, 'cruc'];
    } else if (typeQ === 'reg') {
      curContxt = new DataContxt(pContxt, `reg${cContxt}`);
      this.#sect = ['div', null, CgRightSect.questCls];
      this.#restPar = [curContxt, 'sec'];
    } else if (typeQ === 'multi') {
      curContxt = new DataContxt(pContxt, `multiq${cContxt}`);
      questCls = new DataContxt(curContxt, defInfoCls).newContxt;
      this.#sect = ['div', null, questCls];
      this.#restPar = [curContxt, 'multi'];
    }
  }

  get questCls() {
    return this.#sect[2];
  }

  genQuestData(questInfo) {
    return consoQueryData(
      createEle(...this.#sect),
      questInfo,
      ...this.#restPar
    );
  }
}

export {
  genMenuMarker,
  genMarkerFilt,
  genMenuCut,
  toggleQuestType,
  FormattedQuest,
  consoQueryData,
  genQuestCont,
  displayQuestData,
  noteObj
};
