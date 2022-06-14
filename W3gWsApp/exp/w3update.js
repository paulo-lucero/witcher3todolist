// test: https://jsfiddle.net/q5ufvc32/
function insertData(qData, contEle, sortBasis, ascS = true, nodupl = true) {
  isEle(contEle, 'This Container must be an element');
  isEle(qData, 'quest data must be an element');

  let qParsed = parsedEle(qData);
  // check for same id for multi region quests

  let qISort = qParsed[sortBasis];
  if (qISort === undefined) {
    throw new Error('Can\'t be undefined');
  }
  let allqData = getAllQuests(contEle);
  let dLength = allqData.length;

  const sameIdQ = getQuest(allqData, new RegExp(`^${qParsed.questId}#`));
  if (sameIdQ && nodupl) return;

  function linSrchR(arrData, cIdx) {
    let nIdx = cIdx + 1;
    let qCSort = parsedEle(arrData[cIdx])[sortBasis];
    if (cIdx === 0 && ((ascS && qISort <= qCSort) || (!ascS && qISort >= qCSort))) {
      return arrData[cIdx];
    }
    if (nIdx === dLength) {
      return null;
    }
    let qNSort = parsedEle(arrData[nIdx])[sortBasis];
    return ((ascS && (qISort >= qCSort && qISort <= qNSort)) || (!ascS && (qISort <= qCSort && qISort >= qNSort)))
      ? arrData[nIdx]
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
    return ((ascS && (qISort >= qCSort && qISort <= qNSort)) || (!ascS && (qISort <= qCSort && qISort >= qNSort)))
      ? arrData[nIdx]
      : binSrchR(arrData, rtIdx, ltIdx, mIdx);
  }

  if (dLength === 0) {
    contEle.appendChild(qData);
    return;
  }

  contEle.insertBefore(qData, dLength < 4 ? linSrchR(allqData, 0) : binSrchR(allqData, dLength - 1, 0, null));
}

function GenFetchInit(qrData, filData = null, getInfo = false, note = null) {
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
    // test: https://jsfiddle.net/avm9d62s/2/
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

// =UPDATE DATA MODEL=
// update type
//  quest data
//   e.g. is_multi, cutoff_count, region_cout and etc
//  note container
//   e.g. removing/closing container if empty and inserting quest data on note container
// each update type has its own filter basis
// each update type has its own result/query from database
// process
//  get all selected quest data
//  if done
//   get all quest data
//   conso/process/etc filter basis from quest data
//   retrieve from database
//   activate the update funcs of quest data
//   activate closer funcs of container data
//  if redo
//   get all quest data and container data
//   conso/process/etc filter basis from quest data and container data
//   retrieve from database
//   activate the update funcs of quest data and container data
//  remove the seleceted quest data
