/* global
  inputVisibility,
  extdCreateEle,
  createUrl,
  displayAffected,
  showNotesOverlay,
  questMarking,
  showMultiQuest,
  showDataConfirm
 */

function GenNoteIdentf(qw, em, nt) {
  this.qw = qw;
  this.em = em;
  this.nt = nt;
}

const noteObj = {
  names: new GenNoteIdentf('Missable', 'Enemies', 'Note')
};

function menuClass(questInfo, cls = 'notes-data') {
  return [questInfo.cut ? 'cutoff-quest' : 'normal-quest', cls];
}

function genNullNote(questInfo) {
  return extdCreateEle('span', 'n/a', menuClass(questInfo, 'qnotes-none'));
}

// quest data generation blueprints
function genMenuMarker(questInfo, evtRef) {
  const isMulti = 'quest_count' in questInfo && questInfo.quest_count > 1;
  const custAtr = Object.assign(
    isMulti ? evtRef.getRef : evtRef.getOtrRef(null, 'multi'),
    isMulti ? { 'data-id': questInfo.id } : { type: 'checkbox' }
  );
  const menuMarker = isMulti
    ? extdCreateEle('span', '+', 'mult-reg', null, custAtr)
    : extdCreateEle('input', null, 'quest-marker', null, custAtr);
  if (isMulti) menuMarker.addEventListener('click', showMultiQuest);
  return menuMarker;
}

function genMenuRegNm(questInfo) {
  return extdCreateEle('span', `${questInfo.location} :`, 'multi-rname');
}

function genMenuName(questInfo) {
  return extdCreateEle(
    'span',
    createUrl(
      questInfo.quest_url,
      questInfo.quest_name
    ),
    menuClass(questInfo, 'quest-data'));
}

function genMenuLvl(questInfo) {
  const hasLvl = !!questInfo.req_level;
  return extdCreateEle(
    'span',
    document.createTextNode(hasLvl ? questInfo.req_level : 'n/a'),
    menuClass(questInfo, hasLvl ? 'quest-level' : 'qlvl-none')
  );
}

function genMenuCut(questInfo, evtRef) {
  const custAtr = Object.assign(
    evtRef.getRef,
    { 'data-id': questInfo.id }
  );
  let menuCut;
  if (questInfo.cut >= 0) {
    const innerMenu = extdCreateEle(
      'span',
      questInfo.cut,
      null,
      null,
      custAtr);
    if (questInfo.cut > 0) {
      innerMenu.addEventListener('click', displayAffected);
    }
    menuCut = extdCreateEle('span', innerMenu, menuClass(questInfo));
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
    const innerMenu = extdCreateEle(
      'span',
      noteObj.names[menuKey],
      null,
      null,
      { 'data-notetype': menuKey });
    menuEles.push(
      extdCreateEle('span', innerMenu)
    );
  }
  let menuNote;
  if (menuEles.length >= 1) {
    menuNote = extdCreateEle(
      'span',
      menuEles,
      menuClass(questInfo),
      null,
      { 'data-id': questInfo.id });
    menuNote.addEventListener(
      'click',
      showNotesOverlay.bind([
        createUrl(questInfo.quest_url, questInfo.quest_name),
        document.createTextNode(questInfo.req_level ? questInfo.req_level : 'n/a')
      ]));
  } else {
    menuNote = genNullNote(questInfo);
  }
  return menuNote;
}

function genMenuRegion(questInfo) {
  const menuRegion = extdCreateEle('span', questInfo.region_name);
  menuRegion.addEventListener('click', showDataConfirm.bind(
    {
      regionId: questInfo.region_id,
      show: true
    }
  ));
  return extdCreateEle('span', menuRegion, menuClass(questInfo));
}

/**
 *
 * Generate Quest Data
 * @param {Node|Element|HTMLElement} sect main container element of all quest data
 * @param {JSON} questInfo querried data in json format
 * @param {InfoContxt} contxtRef InfoContxt obj
 * @param {string} mode could be 'all', 'noreg' and 'multi'
 * @returns {Node|Element|HTMLElement}
 */
function consoQueryData(sect, questInfo, contxtRef, mode = 'all') {
  const dataId = questInfo.id.toString(10);
  const multiIdRef = contxtRef.createId(dataId, 'multi'); // attached the id even if not multi
  const questIdRef = contxtRef.createId(dataId, 'gen');
  const menuData = [
    [
      genMenuMarker(multiIdRef, multiIdRef), 'marker'
    ],
    [
      mode === 'multi' ? genMenuRegNm(questInfo) : null, 'regname'
    ],
    [
      genMenuName(questInfo), 'questname'
    ],
    [
      mode !== 'multi' ? genMenuLvl(questInfo) : null, 'lvl'
    ],
    [
      mode !== 'multi' ? genMenuCut(questInfo, questIdRef) : null, 'cut'
    ],
    [
      mode !== 'multi' ? genMenuNote(questInfo) : null, 'note'
    ],
    [
      mode !== 'multi' && mode !== 'noreg' ? genMenuRegion(questInfo) : null, 'reg'
    ]
  ];
  const menuCont = extdCreateEle('div', null, 'menu-cont');
  for (const [ele, type] of menuData) {
    if (ele === null) continue;
    menuCont.appendChild(extdCreateEle('span', ele, type));
  }
  const infoCont = extdCreateEle(
    'div',
    [
      extdCreateEle('div', null, 'sub-multi', multiIdRef.getId),
      extdCreateEle('div', null, 'sub-gen', questIdRef.getId)
    ],
    'quest-info-cont'
  );
  sect.append(menuCont, infoCont);
  const infoReg = 'region_id' in questInfo ? questInfo.region_id : null;
  sect.className = 'quest-container';
  sect.dataset.info = `${dataId}#${infoReg}#${questInfo.req_level}`;
  sect.addEventListener('mouseenter', inputVisibility);
  sect.addEventListener('mouseleave', inputVisibility);
  sect.addEventListener('click', questMarking);
  return sect;
  // attached the questMarking on the sect
}

function displayQuestData(infoCont, infosData, eleType, ...par) {
  // if infoCont is a function, infoData will be passed to it and it should return an element where the infoData will be appended
  for (const infoData of infosData) {
    infoCont = typeof infoCont === 'function' ? infoCont(infoData) : infoCont;
    const questCont = document.createElement(eleType);
    infoCont.appendChild(consoQueryData(questCont, infoData, ...par));
  }
}

// plan:
//  blueprint functions -> returns one object for appending
//  quest data consolidate
//    menu: one main container and sub-containers
//      sub-containers contains data identifiers/etc and one child appended from blueprint functions

// parameters:
//   Object or Primitives?
//   Using primitives, will make function creating for quest data not like blueprint, because it will depends
//    in many variables

// changes in event listeners:
//   showMultiQuest: uses contxt and data-id and note container is not pre-made
//   questMarking: attached on sect, should check the evt.target.class === 'quest-marker'
//   displayAffected: uses contxt and data-id
//   showNotesOverlay:
//     uses data-id
//     attached the eventlistener on the parent container
//       check on the evt.target if has a valid data-notetype
//     check all child elements with data-notetype*
//     create note menus based on the retrieve notetype
