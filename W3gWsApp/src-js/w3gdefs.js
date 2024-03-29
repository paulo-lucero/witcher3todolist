import { InfoCont, Updater } from './w3continfo';
import { questSectMenu, inputLvlQuery, retreiveCrucialData } from './w3gevtltnrs';
import { DataContxt, IdRef } from './w3gcontxt';
import { parsedEle } from './w3parse';

// const sTime = Date.now();
const queryData = {
  isQueryActive: false,
  body: document.querySelector('body'),
  disableQuery: function(parBool, force = false) {
    if (parBool && (force || !this.isQueryActive)) {
      this.isQueryActive = true;
      this.body.classList.toggle('in-query');
      return true;
    } else if (!parBool && (force || this.isQueryActive)) {
      this.body.classList.toggle('in-query');
      this.isQueryActive = false;
    }
    if (force) console.trace(`WARNING!: Force ${parBool ? 'disabling' : 'enabling'} Query`);
    return false;
  }
};
const inputData = {
  inputEle: document.querySelector('#level-query input'),
  arrowUp: document.querySelector('#input-arrowup'),
  arrowDown: document.querySelector('#input-arrowdown')
};

function allowEvt(mode = null) {
  // additional/changes functionalities, only need to work on this function
  const [isAllow, messg] = mode === 'allow-select'
    ? [!queryData.isQueryActive, 'Server is Busy']
    : [!queryData.isQueryActive && !Updater.selectOn, 'Server is Busy OR in selection mode'];

  if (!isAllow) {
    console.trace(messg);
  }

  return isAllow;
}

/**
 *
 * @param {string} eleName 'fragment' or tag name
 * @param {string|Node[]|Node} inhtml
 * @param {string[]|string} eleCls
 * @param {string} idName
 * @param {object} custAtr
 * @returns {Node|Element}
 */
function createEle(eleName, inhtml, eleCls = null, idName = null, custAtr = null, data = null) {
  // assign "inhtml" as null, if there is no innerHTML
  const eleObj = eleName === 'fragment'
    ? document.createDocumentFragment()
    : document.createElement(eleName);
  if (inhtml) {
    if (Array.isArray(inhtml)) {
      inhtml.forEach(function(noteEle) { eleObj.appendChild(noteEle); });
    } else if (typeof inhtml === 'object') {
      eleObj.appendChild(inhtml);
    } else {
      eleObj.innerHTML = inhtml;
    }
  }
  if (eleCls) {
    if (Array.isArray(eleCls)) {
      eleCls.forEach(function(clsN) { eleObj.classList.add(clsN); });
    } else {
      eleObj.className = eleCls;
    }
  }
  if (idName) {
    eleObj.id = idName;
  }
  if (custAtr && typeof custAtr === 'object') {
    Object.keys(custAtr).forEach(eleAtr => eleObj.setAttribute(eleAtr, custAtr[eleAtr]));
  }
  if (data && typeof data === 'object') {
    Object.keys(data).forEach(dataK => {
      eleObj.dataset[dataK] = data[dataK];
    });
  }
  return eleObj;
}

function createUrl(urlLink, urlName, func) {
  const invalidStrs = ['null', 'undefined'];
  let aTag;
  if (urlLink && typeof urlLink === 'string' && urlLink.trim() && !invalidStrs.includes(urlLink)) {
    aTag = document.createElement('a');
    aTag.href = urlLink;
    aTag.innerHTML = urlName;
    aTag.target = '_blank';
  } else {
    if (typeof func === 'function') {
      aTag = func(urlLink, urlName);
    } else {
      aTag = createEle('span', urlName);
    }
  }
  return aTag;
}

async function queryInfo(queryUrl, addtlData = null, noBlock = false, logInfo = false) {
  if (!noBlock ? queryData.disableQuery(true) : true) {
    const fetchData = { cache: 'no-cache' };
    if (addtlData && typeof addtlData === 'object') {
      for (const addtlkey in addtlData) {
        fetchData[addtlkey] = addtlData[addtlkey];
      }
    }
    // console.log(`Fetch Begins Elapsed Time ${Date.now()-sTime}`);
    const getInfo = await fetch(queryUrl, fetchData);
    // console.log(`Fetch Done Elapsed Time ${Date.now()-sTime}`);
    if (!getInfo.ok) {
      if (!noBlock) {
        queryData.disableQuery(false);
      }
      if (queryData.isQueryActive) {
        queryData.disableQuery(false, true);
      }
      throw new Error(`HTTP error! status: ${getInfo.status}`);
    } else {
      const jsoniedInfo = await getInfo.json();
      if (jsoniedInfo && typeof jsoniedInfo === 'object' && 'error' in jsoniedInfo) {
        const errBody = 'code' in jsoniedInfo ? jsoniedInfo.code : jsoniedInfo.stringnified;
        throw new Error(`${jsoniedInfo.error}! status:\n ${errBody}`);
      }
      if (logInfo) console.log(jsoniedInfo);
      if (!noBlock) {
        queryData.disableQuery(false);
      }
      if (queryData.isQueryActive) {
        queryData.disableQuery(false, true);
      }
      return jsoniedInfo;
    }
  }
}

function GenCustomFetchData(addtlData, methodType = 'PATCH') {
  this.method = methodType;
  this.headers = {
    'Content-Type': 'application/json'
  };
  this.body = JSON.stringify(addtlData);
}

function removeData(noteData) {
  let noteInfos;
  if (!Array.isArray(noteData)) {
    noteInfos = [noteData];
  } else {
    noteInfos = noteData;
  }
  for (const noteInfo of noteInfos) {
    while (noteInfo.firstChild) {
      noteInfo.removeChild(noteInfo.firstChild);
    }
  }
}

function retreiveNull(mesg = null) {
  const mesgNull = mesg || 'No Data Available';
  return createEle('div', mesgNull, 'retr-null');
}

function isObj(obj) {
  return obj !== null && !Array.isArray(obj) && typeof obj === 'object';
}

/**
 *
 * @param {Event} evt
 * preferreable setup:
 *  create function for the menu container of menu elements, this function called the isSameRqt()
 *  then function could have multiple sub-instructions or functions for opening
 */
function isSameRqt(evt) {
  const sameRqt = false;
  const openCls = 'menu-opened';
  const recvr = evt.currentTarget;
  const targ = evt.target;
  let curOpen = recvr.getElementsByClassName(openCls);

  if (curOpen.length === 0) {
    targ.classList.toggle(openCls);
    return sameRqt;
  } else {
    curOpen = curOpen[0];
  }

  if (targ === curOpen) {
    return !sameRqt;
  } else {
    curOpen.classList.toggle(openCls);
    targ.classList.toggle(openCls);
    return sameRqt;
  }
}

/**
 *
 * @param {Element|HTMLElement} ele
 * @param {{String:Array|String}} obj use array for multiple values, e.g. classes
 */
function setAttrs(ele, obj, silent = false) {
  isEle(ele, '1st argument should be an element');
  if (!silent && !isObj(obj)) {
    throw new Error('2nd argument should be an object');
  }
  for (const [attr, val] of Object.entries(obj)) {
    if (attr === 'class') {
      if (Array.isArray(val)) {
        ele.classList.add(...val);
      } else {
        ele.classList.add(val);
      }
    } else {
      ele.setAttribute(attr, val);
    }
  }
}

/**
 *
 * @param {Element|HTMLElement} ele
 * @param {{String:[String]|null}} obj use array for multiple values, e.g. classes
 */
function rmvAttrs(ele, obj, silent = false) {
  isEle(ele, '1st argument should be an element');
  if (!silent && !isObj(obj)) {
    throw new Error('2nd argument should be an object');
  }
  for (const [attr, val] of Object.entries(obj)) {
    if (attr === 'class') {
      if (Array.isArray(val)) {
        ele.classList.remove(...val);
      } else {
        ele.classList.remove(val);
      }
    } else {
      ele.removeAttribute(attr);
    }
  }
}

/**
 *
 * @param {any|Element|HTMLElement|[any|Element|HTMLElement]} ele
 * @param {null|String} msg
 * @returns {Boolean}
 */
function isEle(ele, msg = null) {
  const result = Array.isArray(ele)
    ? ele.every(isEle)
    : ele !== null && typeof ele === 'object' && ele.nodeType === Node.ELEMENT_NODE;
  if (result) return true;
  if (typeof msg === 'string') {
    throw new Error(msg);
  } else {
    return false;
  }
}

function isEles(...args) {
  let res = true;
  for (const [obj, msg] of args) {
    res = res && isEle(obj, msg + ' should an element');
  }
  return res;
}

class ParentE {
  /**
   * https://jsfiddle.net/yc540mp6/
   * @param {Element|HTMLElement} ele
   * @param {Function} func should return Boolean
   * @param {Boolean} incl should the last element be included when the func returns false
   */
  constructor(ele, func, incl = false, debg = false) {
    isEle(ele, '1st Arguement should be an element');
    if (typeof func !== 'function') {
      throw new Error('2nd Arguement should be an function');
    }
    this.ele = ele;
    this.func = func;
    this.incl = incl;
    this.isDone = false;
    this.debug = debg;
  }

  next() {
    if (this.debug) {
      console.log(this.ele);
      console.log(this.ele.parentElement);
    }
    const parentEle = this.ele.parentElement;
    const curNext = this.incl && this.isDone
      ? !this.isDone
      : this.func(parentEle);
    const isNext = this.incl && !this.isDone && !curNext
      ? !curNext
      : curNext;
    this.isDone = this.incl && !curNext
      ? !curNext
      : this.isDone;
    if (isNext) {
      this.ele = parentEle;
      return { done: false, value: parentEle };
    } else {
      return { done: true, value: null };
    }
  }

  [Symbol.iterator]() {
    return this;
  }
}

/**
 *
 * @param {Element|HTMLElement} ele
 * @param {*} identf
 */
function getParent(ele, identf) {
  if (!isObj(identf)) {
    throw new Error('Identifier should be an object');
  }
  const eleParents = new ParentE(
    ele,
    elet => !!elet
  );

  let curEle;
  function checkAttr(attr) {
    if (attr === 'class') {
      return curEle.classList.contains(identf[attr]);
    }
    return curEle.getAttribute(attr) === identf[attr];
  }

  const attrs = Object.keys(identf);
  for (const eleParent of eleParents) {
    curEle = eleParent;
    if (attrs.every(checkAttr)) return curEle;
  }
}

// function hasQuests(ele) {
//   // substitute: firstChild, firstElementChild, hasChildNodes, children
//   return Array.from(ele.children).some(chEle => 'info' in chEle.dataset);
// }

// function firstChildQuest(ele) {
//   // substitute: firstChild, firstElementChild, hasChildNodes, children
//   const firstCh = Array.from(ele.children).find(chEle => 'info' in chEle.dataset);
//   return firstCh !== undefined ? firstCh : null;
// }

function getAllQuests(ele) {
  return Array.from(ele.children).filter(chEle => 'info' in chEle.dataset);
}

function getQuest(cont, patt) {
  if (!patt) return;
  const arrCont = Array.isArray(cont) ? cont : Array.from(cont.children);
  return arrCont.find(chEle => 'info' in chEle.dataset && chEle.dataset.info.search(patt) !== -1);
}

// [Setup of Left Section Pane]
class CgLSect {
  /**
   * @type {InfoCont}
   */
  static infoObj = null;
  static menuCls = 'lsect-menu';
  static mainId = 'lsect-menu-main';
  static secId = 'lsect-menu-sec';
  static curCounts = null;
}

function aveSideQ(infoCountr) {
  const countr = document.getElementById('ave-side-cont');
  const curQCounts = CgLSect.curCounts;

  removeData(countr);

  Updater.genOthrFilt(countr, { ave: null });

  const curAve = curQCounts == null || curQCounts.main_count !== infoCountr.main_count
    ? Math.ceil(infoCountr.second_count / infoCountr.main_count)
    : curQCounts.curAve - (curQCounts.second_count - infoCountr.second_count);

  infoCountr.curAve = curAve;

  CgLSect.curCounts = infoCountr;

  countr.appendChild(
    document.createTextNode(curAve)
  );
}

async function createLSect() {
  const questSect = document.getElementById('quests-section');
  const lSectIdf = new DataContxt(null, 'lsect').createId('body');
  CgLSect.infoObj = new InfoCont(
    { id: 'lsect-cont' },
    { id: lSectIdf.getId }
  );
  const lSectMenu = createEle(
    'div',
    [
      createEle(
        'span',
        'Main Quests',
        [CgLSect.menuCls, 'button'],
        CgLSect.mainId
      ),
      createEle(
        'span',
        'Secondary Quests',
        [CgLSect.menuCls, 'button'],
        CgLSect.secId
      )
    ],
    null,
    'lsect-menu-cont',
    lSectIdf.getRef
  );
  lSectMenu.addEventListener('click', questSectMenu);
  CgLSect.infoObj.addHeader(lSectMenu);
  questSect.appendChild(CgLSect.infoObj.getInfo);

  const questsStatus = await queryInfo('/query/check-quests-info');

  aveSideQ(questsStatus);

  const lSectEvt = {
    currentTarget: document.getElementById('lsect-menu-cont'),
    target: questsStatus.main_count
      ? document.getElementById(CgLSect.mainId)
      : questsStatus.second_count
        ? document.getElementById(CgLSect.secId)
        : document.getElementById(CgLSect.mainId)
  };

  await questSectMenu(lSectEvt);

  return true;
}

function mainNoData() {
  const infoObj = CgLSect.infoObj;
  if (InfoCont.isOpen(infoObj)) return;
  const subID = IdRef.getIdRef(document.getElementById('lsect-menu-cont'));

  infoObj.insert(
    { id: subID },
    Updater.genContFilt(
      retreiveNull(),
      { main: null }
    )
  );
}

// [Setup of Right Section Pane]

class CgRightSect {
  static info = document.getElementById('info-section');
  /**
   * @type {InfoCont}
   */
  static infoObj = null;
  static secCls = 'rsect-crucial-sect';
  static order(type, i = 0) {
    const byCateId = {
      1: [0, ['Main Quests', 'mq']],
      2: [2, ['Side Quests', 'sq']],
      3: [1, ['Contract Quests', 'cq']]
    };
    return byCateId[type][i];
  }

  static crucData = [
    ['High Risk', 'hr'],
    ['Low-Risk', 'lr'],
    ['Overleveled', 'ol']
  ];

  static cateData = [
    this.order(1, 1),
    this.order(3, 1),
    this.order(2, 1)
  ];

  static refs = [];
  static recentLvl = parseInt(inputData.inputEle.value, 10);
  static questCls = 'rsect-info-quests';
  static crucHeadCls = 'rsect-cruc-mainhead';
  static curRegName = '';
  static #exclLvlRange = 2; // range of level not included, e.g. 25 - 2 = 23, 25 to 24 is not included isn't considered risk
  static get exclLvlR() {
    return CgRightSect.#exclLvlRange;
  }
}

async function createRightInfo() {
  const rinfoContxt = new DataContxt(null, 'rsect');
  const nullContId = 'info-null-cont'; // null querried data
  const rInfoEle = new InfoCont(
    { id: 'info-sect-cont' },
    { id: nullContId }
  );

  CgRightSect.refs.push(nullContId);

  const crucContxt = new DataContxt(rinfoContxt, 'cruc');
  // scavenger quest
  const scContxt = new DataContxt(crucContxt, 'sca');
  const scIdf = scContxt.createId('scv');
  const scInfo = new InfoCont({ class: CgRightSect.secCls }, { id: scIdf.getId });
  scInfo.addHeader(createEle(
    'div',
    'Scavenger Quests',
    CgRightSect.crucHeadCls));
  rInfoEle.appendInfo(scInfo);
  CgRightSect.refs.push(scIdf.getId);
  //

  // crucial
  for (const [crucName, crucCon] of CgRightSect.crucData) {
    const cateContxt = new DataContxt(crucContxt, crucCon);
    const cateInfos = [];
    const cateIds = [];
    for (const [cateName, idf] of CgRightSect.cateData) {
      const cateIdf = cateContxt.createId(idf);
      const cateInfo = new InfoCont(null, { id: cateIdf.getId });
      cateInfo.addHeader(
        createEle(
          'fragment',
          [
            createEle(
              'div',
              null,
              'cruc-cat-divider'
            ),
            createEle('div', cateName)
          ]
        )
      );
      cateInfos.push(cateInfo);
      cateIds.push(cateIdf.getId);
    }

    const crucInfo = new InfoCont({ class: CgRightSect.secCls }, ...cateInfos);
    crucInfo.addHeader(createEle(
      'div',
      crucName,
      CgRightSect.crucHeadCls));
    rInfoEle.appendInfo(crucInfo);
    CgRightSect.refs.push(cateIds);
  }
  //

  // region based side-quest querying
  const regContxt = new DataContxt(rinfoContxt, 'reg');
  const regIdf = regContxt.createId('scq');
  const regInfo = new InfoCont(null, { id: regIdf.getId });
  rInfoEle.appendInfo(regInfo);
  CgRightSect.refs.push(regIdf.getId);
  //

  CgRightSect.info.append(rInfoEle.getInfo);

  CgRightSect.infoObj = rInfoEle;

  inputData.inputEle.addEventListener('keyup', inputLvlQuery);
  inputData.arrowUp.addEventListener('click', inputLvlQuery);
  inputData.arrowDown.addEventListener('click', inputLvlQuery);

  await retreiveCrucialData(CgRightSect.recentLvl);

  return true;
}

function crucNoData() {
  const infoObj = CgRightSect.infoObj;
  const parsedInfo = parsedEle(infoObj.getInfo);
  if (InfoCont.isOpen(infoObj) || !('cruc' in parsedInfo)) return;
  const nullContnt = createEle(
    'div',
    `No Crucial Quests Data for level: ${CgRightSect.recentLvl}`,
    CgRightSect.questCls);
  infoObj.insert(
    { id: CgRightSect.refs[0] },
    nullContnt
  );
}

function righSectSecNoData() {
  const infoObj = CgRightSect.infoObj;
  const parsedInfo = parsedEle(infoObj.getInfo);
  if (InfoCont.isOpen(infoObj) || !('second' in parsedInfo && 'region' in parsedInfo)) return;

  const secRightSecCont = createEle(
    'div',
    [
      createEle('h4', document.createTextNode(CgRightSect.curRegName))
    ],
    'right-sect-sec'
  );

  const regRef = CgRightSect.refs[5];
  const bodyCont = createEle(
    'div',
    createEle('span', 'No Data Available', CgRightSect.questCls),
    'null-ele'
  );

  secRightSecCont.appendChild(bodyCont);

  CgRightSect.infoObj.insert(
    { id: regRef },
    secRightSecCont,
    bodyCont
  );
}

//

// [Setup of Overlay]
class CgOverlay {
  static overlayOn = false;
  static noteID = 'qnotes-overlay';
  static confirmID = 'confirm-overlay';
  static finishedID = 'qdone-overlay';
  static playersID = 'players-overlay-sub';
  static genNotesID = 'gen-notes-overlay';
  /**
   * @type {InfoCont}
   */
  static infoObj = null;
  static w3Body = document.getElementById('w3g-body');
  static ovlCls = 'overlay-container'; // identifier for InfoCont.removeData
  static curOpenID = null; // element id of the current opened overlay, for closing
  static curQuestID = null; // storing data for quest ID
  static curRegID = null; // storing data for region ID
}

function setupOverlays() {
  const w3Overlay = document.getElementById('w3g-overlay');
  const overlayInfo = new InfoCont(
    null,
    { id: CgOverlay.noteID },
    { id: CgOverlay.confirmID },
    { id: CgOverlay.finishedID },
    { id: CgOverlay.playersID },
    { id: CgOverlay.genNotesID }
  );
  w3Overlay.parentElement.replaceChild(
    overlayInfo.getInfo,
    w3Overlay
  );
  overlayInfo.getInfo.id = w3Overlay.id;
  overlayInfo.getInfo.addEventListener('mousedown', closeNotesOverlay);
  CgOverlay.infoObj = overlayInfo;
}

function openOverlay() {
  CgOverlay.w3Body.classList.add('show-overlay-backg');
  Object.assign(arguments[0], { add: { class: 'show-overlay-body' } });
  CgOverlay.curOpenID = arguments[0].id;
  CgOverlay.infoObj.insert(...arguments);
  CgOverlay.overlayOn = true;
}

function closeNotesOverlay(evt) { // closing overlay notes menu
  const openNotes = evt.target;
  // using "currentTarget", the target is always element with "qnotes-body" id, regardless where click event is dispatched
  const isValid = evt.button === 0 || ('detail' in evt && evt.detail === true);
  // console.log(`${evt.button} | ${evt.detail} | ${!(evt.button === 0 || ('detail' in evt && evt.detail))}`);
  if (!isValid || openNotes.id !== CgOverlay.curOpenID) return;
  InfoCont.removeData(
    document.getElementsByClassName(CgOverlay.ovlCls),
    { rmv: { class: 'show-overlay-body' } }
  );
  const unHiddMarks = document.querySelectorAll('.quest-marker:not(.hidden-marker)');
  for (const unHiddMark of unHiddMarks) {
    unHiddMark.classList.toggle('hidden-marker');
  }
  CgOverlay.w3Body.classList.remove('show-overlay-backg');
  CgOverlay.overlayOn = false;
  Updater.isDone = true;
}

function finishedNoData() {
  const infoObj = new InfoCont(document.getElementById('finished-body-cont'));
  if (InfoCont.isOpen(infoObj)) return;
  infoObj.insert(
    { id: 'finished-null-cont' },
    retreiveNull()
  );
}

export {
  isEle,
  createEle,
  createUrl,
  CgRightSect,
  isObj,
  getAllQuests,
  removeData,
  isEles,
  queryInfo,
  crucNoData,
  mainNoData,
  finishedNoData,
  setAttrs,
  rmvAttrs,
  ParentE,
  getQuest,
  CgOverlay,
  CgLSect,
  aveSideQ,
  getParent,
  inputData,
  retreiveNull,
  allowEvt,
  createRightInfo,
  isSameRqt,
  createLSect,
  setupOverlays,
  openOverlay,
  righSectSecNoData,
  GenCustomFetchData
};
