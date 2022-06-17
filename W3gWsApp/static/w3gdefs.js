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
const pageQuestMenu = document.getElementById('qsect-menu');
const pageQuestBody = document.getElementById('qsect-body');
const infoQuestBody = document.getElementById('info-section');
const noteConts = {
  w3: document.getElementById('w3g-body'),
  nBody: document.getElementById('qnotes-body'),
  nHeader: document.getElementById('qnotes-header'),
  nMenus:  document.getElementById('qnotes-menus'),
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
    let qnoteEles = [noteConts.nHeader.style, noteConts.nMenus.style, noteConts.nData.style];
    qnoteEles.forEach(qnoteEle => qnoteEle.setProperty('display', isShow ? 'none' : 'revert'));
    this.doneSect.style.setProperty('display', isShow ? 'revert' : 'none');
    if (!isShow) removeData(this.doneDataCont);
    this.doneMode = !isShow;
  },
  selectRefrh: function() {
    let hasSelected = document.querySelector('[data-selected=\"true\"]') || !this.selectOn; // if select is on and has selected || if select is off -> need to revert
    this.selectBttn.style.setProperty('cursor', hasSelected ? 'revert' : 'not-allowed');
    return !!hasSelected;
  },
  selectOn: false,
  doneMode: true
};
const infoSect = {
  regionId: null,
  conBody: document.getElementById('confirm-body'),
  opnCrl: document.getElementById('opened-crucial'),
  bttnConf: document.getElementById('confirm-button'),
  bttnCanl: document.getElementById('cancel-button'),
  infoSubs: Array.from(document.getElementsByClassName('info-subsect')),
  infoMenus: Array.from(document.getElementsByClassName('info-menu')),
  cateIndx: {
   1: [1, 'Main Quests'],
   2: [3, 'Contract Quests'],
   3: [2, 'Side Quests']
  },
  cateCls: 'info-note',
  recentLvl: parseInt(inputData.inputEle.value, 10),
  isCrucial: true,
  cateConts: []
};
const menuNames = { //for easy code revision later
  affName: 'Affected',
  misName: 'Missable',
  enmName: 'Enemies',
  genNoteName: function(notesArray) {
    let noteEles = [];
    for (let [noteKey, noteBool] of notesArray) {
      if (noteBool) {
      noteEles.push(extdCreateEle('span', this[noteKey]));
      }
    }
    return noteEles;
  }
};
const notesData = {};

function allowEvt(mode=null) {
  // additional/changes functionalities, only need to work on this function
  let [isAllow, messg] = mode === 'allow-select' ? [!queryData.isQueryActive, 'Server is Busy']
                       : [!queryData.isQueryActive && !markData.selectOn, 'Server is Busy OR in selection mode'];

  if (!isAllow) {
    console.log(messg);
  }

  return isAllow;
}

function genEvtObj(evtFunc, evt) {
  this.evtFunc = evtFunc,
  this.evt = evt;
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
function extdCreateEle(eleName, inhtml, eleCls=null, idName=null, custAtr=null, data=null) {
  // assign "inhtml" as null, if there is no innerHTML
  let eleObj = document.createElement(eleName);
  if (inhtml) {
    if (Array.isArray(inhtml)) {
      inhtml.forEach(function(noteEle) {eleObj.appendChild(noteEle);});
    } else if (typeof inhtml === 'object') {
      eleObj.appendChild(inhtml);
    } else {
      eleObj.innerHTML = inhtml;
    }
  }
  if (eleCls) {
    if (Array.isArray(eleCls)) {
      eleCls.forEach(function(clsN) {eleObj.classList.add(clsN);});
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
  let aTag = document.createElement('a');
  aTag.href = urlLink;
  aTag.innerHTML = urlName;
  aTag.target = '_blank';
  return aTag;
}

async function queryInfo(queryUrl, addtlData=null, noBlock=false) {
  if (!noBlock ? queryData.disableQuery(true) : true) {
    let fetchData = {cache: 'no-cache'};
    if (addtlData && typeof addtlData === 'object') {
      for (let addtlkey in addtlData) {
        fetchData[addtlkey] = addtlData[addtlkey];
      }
    }
    // console.log(`Fetch Begins Elapsed Time ${Date.now()-sTime}`);
    let getInfo = await fetch(queryUrl, fetchData);
    // console.log(`Fetch Done Elapsed Time ${Date.now()-sTime}`);
    if(!getInfo.ok) {
      if(!noBlock) {
        queryData.disableQuery(false);
      }
      if(queryData.isQueryActive) {
        queryData.disableQuery(false, true);
      }
      throw new Error(`HTTP error! status: ${getInfo.status}`);
    } else {
      jsoniedInfo = await getInfo.json();
      if (jsoniedInfo && typeof jsoniedInfo === 'object' && 'error' in jsoniedInfo) {
        let errBody = 'code' in jsoniedInfo ? jsoniedInfo.code : jsoniedInfo.stringnified;
        throw new Error(`${jsoniedInfo.error}! status:\n ${errBody}`);
      }
      console.log(jsoniedInfo);
      if(!noBlock) {
        queryData.disableQuery(false);
      }
      if(queryData.isQueryActive) {
        queryData.disableQuery(false, true);
      }
      return jsoniedInfo;
    }
  }
}

function genNotesData(queryFunc, noteClass, noteHeaders, noteItems, menuClass=null) {
    this.queryUrl = queryFunc,
    this.menuClass = menuClass,
    this.noteClass = noteClass, //orders is important
    this.noteHeaders = noteHeaders, //orders is important
    this.noteItems = noteItems; //orders is important
}

notesData[menuNames.misName] = new genNotesData(
  function(dataId) {return `/query/mis-id-${dataId}`;},
  'qwt-note',
  [
    ['qwtheader-name', 'Players'],
    ['qwtheader-location', 'Location'],
    ['qwtheader-notes', 'Notes']
  ],
  [
    [
      'qwtitem-name',
      ['p_url', 'p_name']
    ],
    ['qwtitem-location', 'p_location'],
    ['qwtitem-notes', 'qwent_notes']
  ],
  menuClass='qwt-menu'
);
notesData[menuNames.enmName] = new genNotesData(
  function(dataId) {return `/query/enm-id-${dataId}`;},
  'enm-note',
  [
    ['enmheader-name', 'Enemies Name'],
    ['enmheader-notes', 'Notes']
  ],
  [
    [
      'enmitem-name',
      ['enemy_url', 'enemy_name']
    ],
    ['enmitem-notes', 'enemy_notes']
  ],
  menuClass='enm-menu'
);

function genNoteHeader(containerEle, headerEleName, headersDef=null) {
  let defaultData = [
    ['headers-questname', 'Quest Name'],
    ['headers-questlvl', 'Level'],
    ['headers-affected', 'Affected'],
    ['headers-notes', 'Notes'],
    ['headers-regquest', 'Reqion Quests']
  ];
  let headersData = Array.isArray(headersDef) && headersDef.every(headerData => Array.isArray(headerData)) ? headersDef
                  : typeof headersDef === 'number' ? defaultData.slice(0, headersDef)
                  : defaultData;
  for (let [hClass, hName] of headersData) {// header
    let noteSpan = document.createElement(headerEleName);
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
  for (let noteInfo of noteInfos) {
    while(noteInfo.firstChild) {
      noteInfo.removeChild(noteInfo.firstChild);
    }
  }
}

function closeNotes(noteContainer, noteClassEle, menuContainer=null) {
  // can use closeNotes to call remove childnodes, just need to pass the noteContainer in an Array
  // when overlay show, noteContainer still dont have any child and menuContainer have childnodes(its length is <= 1)
  // does the value should be null to avoid returning true
  let isSameNote = !!noteClassEle; // if same note return true
  if(menuContainer && ((typeof menuContainer === 'object' && menuContainer.children.length === 1) || isSameNote)) {
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

function retreiveNull(mesg=null) {
  let mesgNull = mesg ? mesg : 'No Data Available';
  return extdCreateEle('div', mesgNull, eleCls='retr-null');
}

function stylng(elmt, prty=null, getp=true) {// Window.getComputedStyle() is read-only
  if (prty && getp === false) {
    elmt.style.removeProperty(prty);
  } else if (getp !== true) {
    elmt.style.setProperty(prty, getp);
  }
  return elmt.style.getPropertyValue(prty) ? elmt.style.getPropertyValue(prty) : window.getComputedStyle(elmt).getPropertyValue(prty);
}

function undsplyEle(bodyConts, preBool=null) {
  for (let bodyCont of bodyConts) {
    let isDplyNone = stylng(bodyCont, 'display') === 'none';
    let isHasNotes = preBool !== null ? preBool : bodyCont.hasChildNodes();
    if (isDplyNone && isHasNotes) {
      stylng(bodyCont, 'display', 'revert');
    } else if (!isDplyNone && !isHasNotes) { //if "else" is use, the bodyCont will be none if the condition = isDplyNone is False while isHasNotes is True
      stylng(bodyCont, 'display', 'none');
      //possible results - false:
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
  let firstCh = Array.from(ele.children).find(chEle => 'info' in chEle.dataset);
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

for (let infoSub of infoSect.infoSubs) {
  for (let order = 1; order <= Object.keys(infoSect.cateIndx).length; order++) {
    let infoIsFirst = infoQuestBody.firstElementChild === infoSub;
    let infoIsLast = infoQuestBody.lastElementChild === infoSub;
    let cateCont = extdCreateEle('div', null, eleCls='info-body');
    cateCont.appendChild(extdCreateEle('div', null, eleCls=infoSect.cateCls));
    infoSub.appendChild(cateCont);
    if (infoIsFirst || infoIsLast) {
      if (infoIsLast) {
        infoSect.infoRegion = cateCont.firstElementChild;
      }
      break;
    } else {
      cateCont.insertBefore(extdCreateEle('div', infoSect.cateIndx[order][1]), cateCont.firstElementChild);
    }
  }
}
{
  let newCateIndx = {};
  Object.keys(infoSect.cateIndx).forEach(function(order) {
    newCateIndx[infoSect.cateIndx[order][0]] = order - 1;
  });
  infoSect.cateIndx = newCateIndx;
}

infoSect.infoSubs.forEach(infoSub => infoSect.cateConts.push(Array.from(infoSub.getElementsByClassName(infoSect.cateCls))));

infoSect.infoRefresh = function(rmvData=false, isCrucial=null) {
  this.isCrucial = typeof isCrucial === 'boolean' ? isCrucial : this.isCrucial;
  let isNote = false;
  let rmvFunc = cateCont => removeData(cateCont);
  let chkChFunc = cateBody => hasQuests(cateBody);
  let refrhNote = cateBody => undsplyEle([cateBody.parentElement], hasQuests(cateBody));
  if (rmvData) {
    this.cateConts.forEach(rmvFunc);
    // contsM.closeCont(infoQuestBody, false);
  } else {
    // contsM.openCont(infoQuestBody, true, this.isCrucial ? {level:this.recentLvl} : {region:this.regionId, second:null}, 'rightsect');
  }
  for (let idx = 0; idx < this.cateConts.length; idx++) {
    let subNoteBool = this.cateConts[idx].some(chkChFunc);
    this.cateConts[idx].forEach(refrhNote);
    undsplyEle([infoSect.infoSubs[idx]], subNoteBool);
    isNote = subNoteBool ? subNoteBool : isNote; // once true, the value wont change even if all next is false
  }
  return isNote;
};
// if (infoSect.cateConts.length === 5) console.log(`Info Bodies Creation Elapsed Time ${Date.now()-sTime}`);
