/* global
    InfoCont,
    DataContxt,
    questSectMenu,
    inputLvlQuery,
    retreiveCrucialData
 */

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
const noteConts = {
  w3: document.getElementById('w3g-body'),
  nBody: document.getElementById('qnotes-body'),
  nHeader: document.getElementById('qnotes-header'),
  nMenus: document.getElementById('qnotes-menus'),
  nData: document.getElementById('qnotes-data'),
  overlayOn: function(isOn) {
    this.nBody.style.display = isOn ? 'flex' : 'none';
    if (isOn) {
      this.w3.style.filter = 'blur(5px)';
    } else {
      this.w3.style.removeProperty('filter');
    }
  }
};
const markData = {
  doneSect: document.getElementById('qdone-data'),
  doneCont: document.getElementById('done-quests'),
  selectBttn: document.querySelector('#quest-query .select-mode'),
  cancelBttn: document.querySelector('#quest-query .cancel-mode'),
  doneSelect: document.querySelector('#qdone-bttns .select-mode'),
  doneCancel: document.querySelector('#qdone-bttns .cancel-mode'),
  recentBttn: document.getElementById('recent-done'),
  allBttn: document.getElementById('all-done'),
  doneDataCont: document.getElementById('done-data-cont'),
  showDone: function(isShow) {
    const qnoteEles = [noteConts.nHeader.style, noteConts.nMenus.style, noteConts.nData.style];
    qnoteEles.forEach(qnoteEle => qnoteEle.setProperty('display', isShow ? 'none' : 'revert'));
    this.doneSect.style.setProperty('display', isShow ? 'revert' : 'none');
    if (!isShow) removeData(this.doneDataCont);
    this.doneMode = !isShow;
  },
  selectRefrh: function() {
    const hasSelected = document.querySelector('[data-selected="true"]') || !this.selectOn; // if select is on and has selected || if select is off -> need to revert
    this.selectBttn.style.setProperty('cursor', hasSelected ? 'revert' : 'not-allowed');
    return !!hasSelected;
  },
  selectOn: false,
  doneMode: true
};
const menuNames = { // for easy code revision later
  affName: 'Affected',
  misName: 'Missable',
  enmName: 'Enemies'
};

function allowEvt(mode = null) {
  // additional/changes functionalities, only need to work on this function
  const [isAllow, messg] = mode === 'allow-select'
    ? [!queryData.isQueryActive, 'Server is Busy']
    : [!queryData.isQueryActive && !markData.selectOn, 'Server is Busy OR in selection mode'];

  if (!isAllow) {
    console.log(messg);
  }

  return isAllow;
}

/**
 *
 * @param {string} eleName
 * @param {string|Node[]|Node} inhtml
 * @param {string[]|string} eleCls
 * @param {string} idName
 * @param {object} custAtr
 * @returns {Node|Element}
 */
function createEle(eleName, inhtml, eleCls = null, idName = null, custAtr = null, data = null) {
  // assign "inhtml" as null, if there is no innerHTML
  const eleObj = document.createElement(eleName);
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

function createUrl(urlLink, urlName) {
  const aTag = document.createElement('a');
  aTag.href = urlLink;
  aTag.innerHTML = urlName;
  aTag.target = '_blank';
  return aTag;
}

async function queryInfo(queryUrl, addtlData = null, noBlock = false) {
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
      console.log(jsoniedInfo);
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

function GenNotesData(queryFunc, noteClass, noteHeaders, noteItems, menuClass = null) {
  this.queryUrl = queryFunc;
  this.menuClass = menuClass;
  this.noteClass = noteClass; // orders is important
  this.noteHeaders = noteHeaders; // orders is important
  this.noteItems = noteItems; // orders is important
}

function genNoteHeader(containerEle, headerEleName, headersDef = null) {
  const defaultData = [
    ['headers-questname', 'Quest Name'],
    ['headers-questlvl', 'Level'],
    ['headers-affected', 'Affected'],
    ['headers-notes', 'Notes'],
    ['headers-regquest', 'Reqion Quests']
  ];
  const headersData = Array.isArray(headersDef) &&
  headersDef.every(headerData => Array.isArray(headerData))
    ? headersDef
    : typeof headersDef === 'number'
      ? defaultData.slice(0, headersDef)
      : defaultData;
  for (const [hClass, hName] of headersData) { // header
    const noteSpan = document.createElement(headerEleName);
    noteSpan.className = hClass;
    noteSpan.innerHTML = hName;
    containerEle.appendChild(noteSpan);
  }
  return containerEle;
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

function closeNotes(noteContainer, noteClassEle, menuContainer = null) {
  // can use closeNotes to call remove childnodes, just need to pass the noteContainer in an Array
  // when overlay show, noteContainer still dont have any child and menuContainer have childnodes(its length is <= 1)
  // does the value should be null to avoid returning true
  const isSameNote = !!noteClassEle; // if same note return true
  if (menuContainer && ((typeof menuContainer === 'object' && menuContainer.children.length === 1) || isSameNote)) {
    // if single note/menu or same note found, don't allowed to close it
    return true;
  }
  if (Array.isArray(noteContainer)) {
    removeData(noteContainer);
  } else {
    if (noteContainer) {
      noteContainer.remove();
    }
  }
  return isSameNote;
}

function retreiveNull(mesg = null) {
  const mesgNull = mesg || 'No Data Available';
  return createEle('div', mesgNull, 'retr-null');
}

function stylng(elmt, prty = null, getp = true) { // Window.getComputedStyle() is read-only
  if (prty && getp === false) {
    elmt.style.removeProperty(prty);
  } else if (getp !== true) {
    elmt.style.setProperty(prty, getp);
  }
  return elmt.style.getPropertyValue(prty) ? elmt.style.getPropertyValue(prty) : window.getComputedStyle(elmt).getPropertyValue(prty);
}

function undsplyEle(bodyConts, preBool = null) {
  for (const bodyCont of bodyConts) {
    const isDplyNone = stylng(bodyCont, 'display') === 'none';
    const isHasNotes = preBool !== null ? preBool : bodyCont.hasChildNodes();
    if (isDplyNone && isHasNotes) {
      stylng(bodyCont, 'display', 'revert');
    } else if (!isDplyNone && !isHasNotes) { // if "else" is use, the bodyCont will be none if the condition = isDplyNone is False while isHasNotes is True
      stylng(bodyCont, 'display', 'none');
      // possible results - false:
      // true && false = unset && with childs - ok
      // false && true = none && w/o childs - ok
      // false && false = none && with child - ok
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

function hasQuests(ele) {
  // substitute: firstChild, firstElementChild, hasChildNodes, children
  return Array.from(ele.children).some(chEle => 'info' in chEle.dataset);
}

function firstChildQuest(ele) {
  // substitute: firstChild, firstElementChild, hasChildNodes, children
  const firstCh = Array.from(ele.children).find(chEle => 'info' in chEle.dataset);
  return firstCh !== undefined ? firstCh : null;
}

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
  static questCls = 'lsect-reg-info-quests';
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
        CgLSect.menuCls,
        CgLSect.mainId
      ),
      createEle(
        'span',
        'Secondary Quests',
        CgLSect.menuCls,
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
// [Setup of Right Section Pane]

class CgRightSect {
  static info = document.getElementById('info-section');
  /**
   * @type {InfoCont}
   */
  static infoObj = null;
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
    this.order(2, 1),
    this.order(3, 1)
  ];

  static refs = [];
  static recentLvl = parseInt(inputData.inputEle.value, 10);
  static questCls = 'rsect-info-quests';
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
  const scInfo = new InfoCont(null, { id: scIdf.getId });
  scInfo.addHeader(createEle('div', 'Scavenger Quests'));
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
        createEle('div', cateName)
      );
      cateInfos.push(cateInfo);
      cateIds.push(cateIdf.getId);
    }

    const crucInfo = new InfoCont(null, ...cateInfos);
    crucInfo.addHeader(createEle('div', crucName));
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
//
