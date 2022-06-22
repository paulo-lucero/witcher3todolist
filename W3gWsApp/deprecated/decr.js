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
    const filSpec = {
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
        const filT = entFilData[idx][0];
        const filV = entFilData[idx][1];
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
        procCont = createEle(contNm, ...crtElePar);
      } else {
        procCont = createEle(contNm);
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
    const chkSame = ky => ky in contEle && idfrs[ky] === contEle[ky];
    if (contEle !== null) isEle(contEle,'The container is not an Element');
    const suspClose = typeof idfrs === 'boolean' ? idfrs
                    : (idfrs !== null && typeof idfrs === 'object') ?
                      (hasQuests(contEle) && Object.keys(idfrs).every(chkSame))
                    : contEle === null || !hasQuests(contEle);
    // if same note, True -> dont close it
   //  if have no quests or null, True -> dont close it
    if (!suspClose || updMode) {
      const isReus = 'isrmv' in contEle.dataset ? JSON.parse(contEle.dataset.isrmv)
                   : !hasQuests(contEle) ? true : null;
      // empty container are assume to be reusable
      // a container with quest data should have data-cont
      // assume that the reusable container are empty at first
      for (const contPar of ['cont', 'isrmv', 'closer']) {
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
    const uniqFil = new Map();
    function setHasFil(filType, contData) {
      const filsBasis = uniqFil.get(filType);
      for (const type of Object.keys(filsBasis)) {
        const val = filsBasis[type];
        if (!Array.isArray(val)) {
          if (val === contData[type]) continue;
          const arVal = [val];
          arVal.push(contData[type]);
          filsBasis[type] = arVal;
        } else {
          if (val.includes(contData[type])) continue;
          val.push(contData[type]);
        }
      }
    }
    function consoFilter(contsData) {
      for (const contData of contsData) {
        const filType = Object.keys(contData).join('-');
        if (uniqFil.has(filType)) {
          setHasFil(filType, contData);
        } else {
          uniqFil.set(filType, contData);
        }
      }
      return Array.from(uniqFil.values());
    }

    const allConts = document.querySelectorAll('[data-cont]');
    const allCountr = document.querySelectorAll('[data-countr]');
    const markedConts = document.querySelectorAll('[data-selected=\"true\"]');
    const qrIds = (markedConts.length !== 0) ? parsedAll(markedConts, 'level') : null;
    if (qrIds && markData.doneMode) {
      const doneDate = Date.now();
      qrIds.forEach(qr => qr.doneDate = doneDate);
    }
    let filtersBasis = null;
    if (allConts.length !== 0 && !markData.doneMode) {
      filtersBasis = consoFilter(parsedAll(allConts));
    }
    const resultData = await queryInfo('/query/request-modif', new GenFetchInit(isRedoAll ? null : qrIds, filtersBasis));
    if (qrIds !== null && !isRedoAll && resultData.modified !== qrIds.length) {
      throw new Error(`Unexpected number of changes made: modified count ${resultData.modified} | marked data count ${qrIds.length} | Quest Ids ${qrIds.toString()}`);
    }
    if (qrIds !== null) { // remove marked quest data containers
      for (const markedCont of markedConts) {
        markedCont.remove();
      }
    }
    if (resultData.err_r) {
      throw new Error(`Error Detected: \n SQL Command executed = ${resultData.sql_cmd}\n Error Message: ${resultData.err_r}`);
    }
    const updateData = [
      [filtersBasis && resultData.result, this.contUpdr.values(), resultData.result],
      [allCountr.length !== 0 && resultData.count, this.countrUpdr.values(), resultData.count]
    ];
    for (const [isUpdate, itrUpdrs, resultVal] of updateData) { // calling containers and counts updater funcs
      if (!isUpdate) continue;
      for (const itrUpdr of itrUpdrs) {
        itrUpdr(resultVal);
      }
    }
    for (const cont of allConts) { // close empty containers
      const closerName = cont.dataset.closer;
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