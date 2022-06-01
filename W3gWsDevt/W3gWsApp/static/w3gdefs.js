// const sTime = Date.now();
const queryData = {
  isQueryActive: false,
  body: document.querySelector('body'),
  disableQuery: function(parBool, force=false) {
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
  arrowDown: document.querySelector('#input-arrowdown'),
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

function extdCreateEle(eleName, inhtml, eleCls=null, idName=null, custAtr=null) {
  //assign "inhtml" as null, if there is no innerHTML
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

function finalData(dataInfo, isInclReg, custmCls, affFunc, noteFunc, doneFunc, multiFunc, confFunc) {
// [displayAffected, showNotesOverlay, doneQuest, showMultiQuest, showDataConfirm]

  function genMenuData(menuName, eventFunc=null, menuIsEvt=null, menuCont=null, custmPar=null) {
    this.menuName = menuName,
    this.eventFunc = eventFunc,
    this.menuIsEvt = menuIsEvt === null ? true : false;
    this.menuCont = menuCont ? menuCont : 'span';
    this.custmPar = Array.isArray(custmPar) ? custmPar : null; //to be spread on the extdCreateEle func
  }

  let dataId = dataInfo.id;
  let multiBool = 'quest_count' in dataInfo && dataInfo.quest_count > 1;
  let noteCls = 'notes-data';
  let itemClass = addtlCls => [dataInfo.cut ? 'cutoff-quest' : 'normal-quest', addtlCls];
  let nullNote = new genMenuData('n/a', null, false, null, [itemClass('qnotes-none')]);

  let fixedData = [
    multiBool ?
      new genMenuData('+', multiFunc, false, null, ['mult-reg', null, {'data-id':dataId}]) :
      new genMenuData(null, doneFunc, false, 'input', ['quest-marker', null, {type:'checkbox'}]),
    new genMenuData(createUrl(dataInfo.quest_url, dataInfo.quest_name), null, false, null, [itemClass('quest-data')]),
    dataInfo.req_level ?
      new genMenuData(document.createTextNode(dataInfo.req_level), null, false, null, [itemClass('quest-level')]) :
      new genMenuData(document.createTextNode('n/a'), null, false, null, [itemClass('qlvl-none')])
  ];
  let noteData = [
    (affFunc && dataInfo.cut >= 0) ?
      new genMenuData(dataInfo.cut, dataInfo.cut > 0 ? affFunc.bind(dataId) : null, null, null, [itemClass(noteCls)]) :
      nullNote,
    (noteFunc && (dataInfo.qwt || dataInfo.enm)) ?
      new genMenuData(
        menuNames.genNoteName( [ ['misName', dataInfo.qwt], ['enmName', dataInfo.enm] ] ),
        noteFunc.bind(
          {
            dataId:dataId,
            notes:[ [menuNames.misName, dataInfo.qwt], [menuNames.enmName, dataInfo.enm] ],
            headers: fixedData.map(
              function(eleDat) {
                if (eleDat.menuName && typeof eleDat.menuName === 'object') return eleDat.menuName.cloneNode(true);
              }
            )
          }
        ),
        null, null,
        [itemClass(noteCls)]
      ) :
      nullNote,
    (isInclReg && 'region_id' in dataInfo && confFunc) ?
      new genMenuData(
        'region_name' in dataInfo ? dataInfo.region_name : null,
        confFunc.bind(
          {
            regionId: dataInfo.region_id,
            show: true
          }
        ),
        null, null,
        [itemClass(noteCls)]
      ) :
      nullNote
  ];

  this.procdData = [];
  this.multiBool = multiBool;
  this.multiData = dataInfo.is_multi ? {quest:dataId} : null;
  this.qInfo = `${dataId}#${'region_id' in dataInfo ? dataInfo.region_id : null}#${dataInfo.req_level}`;

  for (let questData of fixedData.concat(noteData)) {
    this.procdData.push(questData);
  }
}

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
  //can use closeNotes to call remove childnodes, just need to pass the noteContainer in an Array
  //when overlay show, noteContainer still dont have any child and menuContainer have childnodes(its length is <= 1)
  //does the value should be null to avoid returning true
  let isSameNote = !!noteClassEle; // if same note return true
  if(menuContainer && ((typeof menuContainer === 'object' && menuContainer.children.length === 1) || isSameNote)) {
    //if single note/menu or same note found, don't allowed to close it
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

function modifData(dataQuestRegion, getInfo=false, note=null) {
  // affect all quest: dataQuestRegion = null

  function genQRobj(questId, regionId, doneDate) {
    if ((typeof questId  === 'number' || questId === null) && (typeof regionId  === 'number' || regionId === null)) {
      this.questId = questId;
      this.regionId = regionId;
      this.doneDate = doneDate;
    } else {
      throw new Error('Not Valid type');
    }
  }

  function genQuestData(dataQR) {
    let genPerObj = ([qData, rData, dtData]) => new genQRobj(qData, rData, dtData);
    if (Array.isArray(dataQR)) {
      return dataQR.every(qr => Array.isArray(qr)) ? dataQR.map(genPerObj) : [new genQRobj(...dataQR)];
    } else if (dataQR === null) {
      return dataQR;
    } else {
      throw new Error('Not an array or null');
    }
  }

  this.method = 'PATCH';
  this.headers = {
    'Content-Type': 'application/json'
  };
  this.body = JSON.stringify(
    {
      questData: genQuestData(dataQuestRegion),
      done: !(getInfo || note) ? markData.doneMode : null,
      redo: !(getInfo || note) ? !markData.doneMode : null,
      query: getInfo ? getInfo : false,
      note: note
    }
  );
}

function uniqueQRid(qrIds) {
  let duplIdx = [];
  let procdQR = [];
  function notSameID(lQR, rQR) {
    for (let idx = 0; idx < lQR.length; idx++) {
      if (lQR[idx] !== rQR[idx]) {
        return true;
      }
    }
    return false;
  }
  function isDupl(idx) {
    if (duplIdx.includes(idx)) return true;
    for (let rIdx = idx + 1; rIdx < qrIds.length; rIdx++) {
      if (duplIdx.includes(rIdx)) continue;
      if (!notSameID(qrIds[idx], qrIds[rIdx])) {
        duplIdx.push(rIdx);
      }
    }
    return false;
  }
  for (let idx = 0; idx < qrIds.length; idx++) {
    if (!isDupl(idx)) procdQR.push(qrIds[idx]);
  }
  return procdQR;
}
//let te = [[1, 2], [3, 4], [4, 5] ,[1, 2], [6, 7]];
//console.log(testUnique(te));

function isEle(ele, msg=null) {
  if (ele !== null && typeof ele === 'object' && ele.nodeType === Node.ELEMENT_NODE) return true;
  if (typeof msg === 'string') {
    throw new Error(msg);
  }
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

//test: https://jsfiddle.net/e1aLbgv7/
class EleData {
  constructor(forParse, ...notInc) {
    if (typeof forParse === 'string') {
      forParse = document.querySelectorAll(forParse);
    }
    if (!('length' in forParse)) {
      forParse = [forParse];
    }
    if (!(Array.isArray(forParse))) {
      forParse = Array.from(forParse);
    }
    let eles = new Map();

    let uniqueData = new Map(); // all data parsed are unique
    let configParse = {
      info: ['questId', 'regionId', 'level'],
      cont: null
    };
    function parseVal(strng) {
      let resultPars = parseInt(strng, 10);
      return !isNaN(resultPars) ? resultPars : strng === 'null' ? null : strng;
    }
    function byConfig(rawData, basisParse) {
      let spltd = rawData.split('#');
      if (spltd.length !== basisParse.length) {
        throw new Error('unequal amount of parsable data values');
      }
      let parsedInfo = {};
      for (let idx = 0; idx < basisParse.length; idx++) {
        let infoVal = parseVal(spltd[idx]);
        if (notInc.length > 0) {
          if(!notInc.includes(basisParse[idx])) parsedInfo[basisParse[idx]] = infoVal;
        } else {
          parsedInfo[basisParse[idx]] = infoVal;
        }
      }
      return parsedInfo;
    }
    function bySelf(rawData) {
      if (rawData.indexOf(':') === -1) {
        throw new Error(`Unable to parse, due to no value can be assigned as key or value on : ${rawData}`);
      }
      let parsedInfo = {};
      for (let rawD of rawData.split('-')) {
        let spltd = rawD.split(':');
        if (spltd.length > 2) {
          throw new Error(`Too many data to determine which is value : ${spltd}`);
        }
        let infoVal = parseVal(spltd[1]);
        parsedInfo[spltd[0]] = infoVal;
      }
      return parsedInfo;
    }
    function getUnique(rawInfo) {
      if (rawInfo.nodeType !== Node.ELEMENT_NODE) {
        throw new Error('Not an element');
      }
      let dataKeys = Object.keys(rawInfo.dataset);
      if (dataKeys.length === 0) {
        throw new Error('no data key/s found to parse');
      }
      let foundKeys = dataKeys.filter(dataKey => dataKey in configParse);
      if (foundKeys.length === 0) {
        throw new Error('element data doesn\'t contain something that can be parsed');
      }
      if (foundKeys.length > 1) {
        throw new Error(`Found multiple matched data key to parse: ${foundKeys}`);
      }
      let basisKey = foundKeys[0];
      if (!(rawInfo.dataset[basisKey])) {
        throw new Error('Data for parsing is empty string');
      }
      let dataVal = rawInfo.dataset[basisKey];
      uniqueData.set(dataVal, configParse[basisKey]);
      if (eles.has(dataVal)) {
        eles.get(dataVal).push(rawInfo);
      } else {
        eles.set(dataVal, [rawInfo]);
      }
    }
    for (let rawInfo of forParse) {
      getUnique(rawInfo);
    }
    this.eles = Array.from(eles.values());
    this.procd = [];
    for (let [rawData, basisParse] of uniqueData.entries()) {
      this.procd.push(basisParse ? byConfig(rawData, basisParse) : bySelf(rawData));
    }
    if(this.eles.length !== this.procd.length) {
      throw new Error(`Something went wrong not all element data are parsed: parsed count is ${this.procd.length} while count of elements are ${this.eles.length}`);
    }
  }
  get parsed() {
    return this.procd;
  }
  getIdx(ky, vl) {
    return this.parsed.findIndex(dt => dt[ky] === vl);
  }
  getEleAll(ky, vl) {
    let parsedIdx = this.getIdx(ky, vl);
    if (parsedIdx === -1) return null;
    return this.eles[parsedIdx];
  }
  getEle(ky, vl) {
    let allEles = this.getEleAll(ky, vl);
    return (allEles !== null) ? allEles[0] : allEles;
  }
}

function parsedAll() {
  return new EleData(...arguments).parsed;
}

function parsedEle() {
  return parsedAll(...arguments)[0];
}

// test: https://jsfiddle.net/q5ufvc32/
function insertData(qData, contEle, sortBasis, ascS=true) {
  isEle(contEle, 'This Container must be an element');
  isEle(qData, 'quest data must be an element');

  let qISort = parsedEle(qData)[sortBasis];
  if (qISort === undefined) {
    throw new Error('Can\'t be undefined');
  }
  let allqData = contEle.querySelectorAll('[data-info]');
  let dLength = allqData.length;

  function linSrchR(arrData, cIdx) {
    let nIdx = cIdx + 1;
    let qCSort = parsedEle(arrData[cIdx])[sortBasis];
    if (cIdx === 0 && (ascS && qISort <= qCSort || !ascS && qISort >= qCSort)) {
      return arrData[cIdx];
    }
    if (nIdx === dLength) {
      return null;
    }
    let qNSort = parsedEle(arrData[nIdx])[sortBasis];
    return ((ascS && (qISort >= qCSort && qISort <= qNSort)) || (!ascS && (qISort <= qCSort && qISort >= qNSort))) ? arrData[nIdx]
           : linSrchR(arrData, cIdx + 1);
  }

  function binSrchR(arrData, rtIdx, ltIdx, pIdx) {
    let mIdx = Math.ceil((rtIdx + ltIdx) / 2);
    mIdx = mIdx === pIdx ? mIdx - 1 : mIdx;
    let nIdx = mIdx + 1;
    if (mIdx === -1) {
      return arrData[0];
    }
    if (nIdx === dLength) {
      return null;
    }
    let qCSort = parsedEle(arrData[mIdx])[sortBasis];
    let qNSort = parsedEle(arrData[nIdx])[sortBasis];
    rtIdx = ((ascS && qISort <= qNSort) || (!ascS && qISort >= qNSort)) ? mIdx : rtIdx;
    ltIdx = ((ascS && qISort >= qCSort) || (!ascS && qISort <= qCSort)) ? mIdx : ltIdx;
    return ((ascS && (qISort >= qCSort && qISort <= qNSort)) || (!ascS && (qISort <= qCSort && qISort >= qNSort))) ? arrData[nIdx]
           : binSrchR(arrData, rtIdx, ltIdx, mIdx);
  }

  if (dLength === 0) {
   contEle.appendChild(qData);
   return;
  }

  contEle.insertBefore(qData, dLength < 4 ? linSrchR(allqData, 0) : binSrchR(allqData, dLength - 1, 0, null));
}

function GenFetchInit(qrData, filData=null, getInfo=false, note=null) {
  this.method = 'PATCH';
  this.headers = {
    'Content-Type': 'application/json'
  };
  this.body = JSON.stringify(
    {
      questData: qrData,
      filter: filData,
      done: !(getInfo || note) ? markData.doneMode : null,
      redo: !(getInfo || note) ? !markData.doneMode : null,
      query: getInfo,
      note: note
    }
  );
}

class ContMngr {
  constructor() {
    this.contUpdr = new Set();
    this.countrUpdr = new Set();
    this.contCloser = new Map();
  }
  addContUpdater(func) {
    this.contUpdr.add(func);
  }
  addCountrUpdater(func) {
    this.countrUpdr.add(func);
  }
  addContCloser(closerName, func) {
    if(typeof closerName !== 'string') {
      throw new Error(`closer name should be an string, not ${typeof closerName}`);
    }
    this.contCloser.set(closerName, func);
  }
  openCont(contNm, isReus, filData, closer, ...crtElePar) {
    //test: https://jsfiddle.net/avm9d62s/2/
    if (typeof filData !== 'object') {
      throw new Error('fiter data should be an object or null');
    }
    let filSpec = {
      main: null,
      second: null,
      category: [1, 2, 3, 4],
      region: [1, 2, 3, 4, 5, 6, 7],
      level: 'number',
      cutoff: 'number',
      quest: 'number'
    };
    let procCont = null;
    let entFilData = null;
    if (filData !== null) {
      entFilData = Object.entries(filData);
      for (let idx = 0; idx < entFilData.length; idx++) {
        let filT = entFilData[idx][0];
        let filV = entFilData[idx][1];
        if (!(filT in filSpec)) {
          throw new Error(`This filter type ${filT} is not valid`);
        }
        if (filSpec[filT] === null && filV !== null) {
          throw new Error(`This ${filT} filter value should be null, not ${filV}`);
        } else if (Array.isArray(filSpec[filT]) && !(filSpec[filT].includes(filV))) {
          throw new Error(`The value ${filV} of this ${filT} filter is not valid`);
        } else if (filSpec[filT] === 'number' && typeof filV !== 'number') {
          throw new Error(`The value ${filV} of this ${filT} filter should be a Number`);
        }
        if (filV === null) {
          entFilData[idx][1] = 'null';
        }
      }
    }
    if (typeof contNm === 'string') {
      if (crtElePar.length > 0) {
        procCont = extdCreateEle(contNm, ...crtElePar);
      } else {
        procCont = extdCreateEle(contNm);
      }
    } else if (contNm.nodeType !== Node.ELEMENT_NODE) {
      console.trace();
      throw new Error('The container is not an Element');
    } else {
      procCont = contNm;
    }
    procCont.dataset.cont = (entFilData !== null) ? entFilData.map(filD => filD.join(':')).join('-') : '';
    procCont.dataset.isrmv = !!isReus;
    procCont.dataset.closer = typeof closer === 'string' ? closer : 'unnamed';
    return procCont;
  }
  closeCont(contEle, cleanCont=true, idfrs=null, updMode=false) {
    // test: https://jsfiddle.net/dc0xegfj/
    // contEle -> current container
    // cCont -> container wishes to open
    let chkSame = ky => ky in contEle && idfrs[ky] === contEle[ky];
    if (contEle !== null) isEle(contEle,'The container is not an Element');
    let suspClose = typeof idfrs === 'boolean' ? idfrs
                    : (idfrs !== null && typeof idfrs === 'object') ?
                      (hasQuests(contEle) && Object.keys(idfrs).every(chkSame))
                    : contEle === null || !hasQuests(contEle);
    // if same note, True -> dont close it
   //  if have no quests or null, True -> dont close it
    if (!suspClose || updMode) {
      let isReus = 'isrmv' in contEle.dataset ? JSON.parse(contEle.dataset.isrmv)
                   : !hasQuests(contEle) ? true : null;
      // empty container are assume to be reusable
      // a container with quest data should have data-cont
      // assume that the reusable container are empty at first
      for (let contPar of ['cont', 'isrmv', 'closer']) {
        if (!(contPar in contEle.dataset)) {
          if (isReus !== null) continue;
          console.trace();
          throw new Error(`This ${contPar} data isn\'t found on the container`);
        }
        delete contEle.dataset[contPar];
      }
      if (cleanCont) {
        if (isReus) {
          removeData(contEle);
        } else {
          contEle.remove();
        }
      }
    }
    return suspClose;
  }
  async update(isRedoAll=false) {
    //test: https://jsfiddle.net/d2qzb6w3/3/
    let uniqFil = new Map();
    function setHasFil(filType, contData) {
      let filsBasis = uniqFil.get(filType);
      for (let type of Object.keys(filsBasis)) {
        let val = filsBasis[type];
        if (!Array.isArray(val)) {
          if (val === contData[type]) continue;
          let arVal = [val];
          arVal.push(contData[type]);
          filsBasis[type] = arVal;
        } else {
          if (val.includes(contData[type])) continue;
          val.push(contData[type]);
        }
      }
    }
    function consoFilter(contsData) {
      for (let contData of contsData) {
        let filType = Object.keys(contData).join('-');
        if (uniqFil.has(filType)) {
          setHasFil(filType, contData);
        } else {
          uniqFil.set(filType, contData);
        }
      }
      return Array.from(uniqFil.values());
    }

    let allConts = document.querySelectorAll('[data-cont]');
    let allCountr = document.querySelectorAll('[data-countr]');
    let markedConts = document.querySelectorAll('[data-selected=\"true\"]');
    let qrIds = (markedConts.length !== 0) ? parsedAll(markedConts, 'level') : null;
    if (qrIds && markData.doneMode) {
      let doneDate = Date.now();
      qrIds.forEach(qr => qr.doneDate = doneDate);
    }
    let filtersBasis = null;
    if (allConts.length !== 0 && !markData.doneMode) {
      filtersBasis = consoFilter(parsedAll(allConts));
    }
    let resultData = await queryInfo('/query/request-modif', new GenFetchInit(isRedoAll ? null : qrIds, filtersBasis));
    if (qrIds !== null && !isRedoAll && resultData.modified !== qrIds.length) {
      throw new Error(`Unexpected number of changes made: modified count ${resultData.modified} | marked data count ${qrIds.length} | Quest Ids ${qrIds.toString()}`);
    }
    if (qrIds !== null) { // remove marked quest data containers
      for (let markedCont of markedConts) {
        markedCont.remove();
      }
    }
    if (resultData.err_r) {
      throw new Error(`Error Detected: \n SQL Command executed = ${resultData.sql_cmd}\n Error Message: ${resultData.err_r}`);
    }
    let updateData = [
      [filtersBasis && resultData.result, this.contUpdr.values(), resultData.result],
      [allCountr.length !== 0 && resultData.count, this.countrUpdr.values(), resultData.count]
    ];
    for (let [isUpdate, itrUpdrs, resultVal] of updateData) { // calling containers and counts updater funcs
      if (!isUpdate) continue;
      for (let itrUpdr of itrUpdrs) {
        itrUpdr(resultVal);
      }
    }
    for (let cont of allConts) { // close empty containers
      let closerName = cont.dataset.closer;
      if (closerName === 'unnamed') {
        if (hasQuests(cont)) continue;
        this.closeCont(cont, true, null, true);
      } else if (this.contCloser.has(closerName)) {
        this.contCloser.get(closerName)(cont);
      }
    }
  }
}

const contsM = new ContMngr();

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
    contsM.closeCont(infoQuestBody, false);
  } else {
    contsM.openCont(infoQuestBody, true, this.isCrucial ? {level:this.recentLvl} : {region:this.regionId, second:null}, 'rightsect');
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
