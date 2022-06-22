/* global
    createEle,
    parsedEle,
    getAllQuests,
    getQuest,
    isEle,
    markData,
    removeData,
    isEles,
    DataContxt
*/

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
  if (!silent && isObj(obj)) {
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

// test: https://jsfiddle.net/q5ufvc32/
function insertData(qData, contEle, sortBasis, ascS = true, nodupl = true) {
  isEle(contEle, 'This Container must be an element');
  isEle(qData, 'Quest data must be an element');

  const qParsed = parsedEle(qData);
  // check for same id for multi region quests

  const qISort = qParsed[sortBasis];
  if (qISort === undefined) {
    throw new Error('Can\'t be undefined');
  }
  const allqData = getAllQuests(contEle);
  const dLength = allqData.length;

  const sameIdQ = getQuest(allqData, new RegExp(`^${qParsed.questId}#`));
  if (sameIdQ && nodupl) return;

  function linSrchR(arrData, cIdx) {
    const nIdx = cIdx + 1;
    const qCSort = parsedEle(arrData[cIdx])[sortBasis];
    if (cIdx === 0 && ((ascS && qISort <= qCSort) || (!ascS && qISort >= qCSort))) {
      return arrData[cIdx];
    }
    if (nIdx === dLength) {
      return null;
    }
    const qNSort = parsedEle(arrData[nIdx])[sortBasis];
    return ((ascS && (qISort >= qCSort && qISort <= qNSort)) || (!ascS && (qISort <= qCSort && qISort >= qNSort)))
      ? arrData[nIdx]
      : linSrchR(arrData, cIdx + 1);
  }

  function binSrchR(arrData, rtIdx, ltIdx, pIdx) {
    let mIdx = Math.ceil((rtIdx + ltIdx) / 2);
    mIdx = mIdx === pIdx ? mIdx - 1 : mIdx;
    const nIdx = mIdx + 1;
    if (mIdx === -1) {
      return arrData[0];
    }
    if (nIdx === dLength) {
      return null;
    }
    const qCSort = parsedEle(arrData[mIdx])[sortBasis];
    const qNSort = parsedEle(arrData[nIdx])[sortBasis];
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
      note
    }
  );
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

class QuestCont {
  static #mainCls = 'quest-cont-main';
  static #headCls = 'quest-cont-head';
  static #bodyCls = 'quest-cont-body';
  static #headWrpCls = 'quest-wrap-head';
  static #bodyWrpCls = 'quest-wrap-body';
  static #wrapper(ele, wrpCls, refThis, refWrp) {
    if (!isEle(ele)) return;
    const wrpEle = this[refWrp];
    let refEle;
    if (wrpEle) {
      wrpEle.classList.toggle(wrpCls);
      refEle = wrpEle;
    } else {
      refEle = this[refThis];
    };
    ele.classList.toggle(wrpCls);
    this[refWrp] = ele;
    const refPar = refEle.parentElement;
    ele.appendChild(refEle);
    refPar.appendChild(ele);
  }

  #mainEle;
  #headerEle;
  #bodyEle;
  #headWrpEle;
  #bodyWrpEle;
  /**
   *
   * @param {Element|HTMLElement|null} obj
   * @param {{str:String|[String]}} mainAtr main element attribute: use array for mulitple values
   * @param {{str:String|[String]}} headAtr header element attribute: use array for mulitple values
   * @param {{str:String|[String]}} bodyAtr body element attribute: use array for mulitple values
   */
  constructor(obj, mainAtr, headAtr, bodyAtr) {
    let isCont = isEle(obj) && obj.classList.contains(QuestCont.#mainCls);
    this.#mainEle = isCont
      ? obj
      : createEle(
        'div',
        null,
        QuestCont.#mainCls
      );
    const headCol = isCont &&= obj.getElementsByClassName(QuestCont.#headCls);
    const bodyCol = isCont &&= obj.getElementsByClassName(QuestCont.#bodyCls);
    this.#headerEle = isCont
      ? (headCol.length !== 0
          ? headCol[0]
          : null)
      : createEle('div', null, QuestCont.#headCls);
    this.#bodyEle = isCont
      ? (bodyCol.length !== 0
          ? bodyCol[0]
          : null)
      : createEle('div', null, QuestCont.#bodyCls);

    if (!isCont) {
      this.main.append(
        this.header,
        this.body
      );
    }

    const headWrpCol = isCont &&= obj.getElementsByClassName(QuestCont.#headWrpCls);
    const bodyWrpCol = isCont &&= obj.getElementsByClassName(QuestCont.#bodyWrpCls);
    this.#headWrpEle = headWrpCol && headWrpCol.length !== 0
      ? headWrpCol[0]
      : null;
    this.#bodyWrpEle = bodyWrpCol && bodyWrpCol.length !== 0
      ? bodyWrpCol[0]
      : null;

    isEles([this.header, 'Header Container'], [this.body, 'Body Container']);
    if (mainAtr) setAttrs(this.main, mainAtr);
    if (headAtr) setAttrs(this.header, headAtr);
    if (bodyAtr) setAttrs(this.body, bodyAtr);
  }

  /**
   * @returns {Element}
   */
  get main() {
    return this.#mainEle;
  }

  get header() {
    return this.#headerEle;
  }

  get body() {
    return this.#bodyEle;
  }

  get headWrp() {
    return this.#headWrpEle;
  }

  get bodyWrp() {
    return this.#bodyWrpEle;
  }

  close() {
    const main = this.main;
    if (main) main.remove();
    this.#mainEle = null;
  }

  /**
   *
   * @param {Node|Element|HTMLElement} ele
   */
  setHeader(ele) {
    this.header.appendChild(ele);
  }

  /**
   *
   * @param {Node|Element|HTMLElement} data
   */
  insert(data) {
    this.body.appendChild(data);
  }

  /**
   *
   * @param {Node|Element|HTMLElement} ele
   */
  addLayerMain(ele) {
    if (!isEle(ele)) return;
    while (this.main.firstChild) {
      ele.appendChild(this.main.firstChild);
    }
    this.main.appendChild(ele);
  }

  /**
   *
   * @param {Node|Element|HTMLElement} ele
   */
  wrapHead(ele) {
    QuestCont.#wrapper(
      ele,
      QuestCont.#headWrpCls,
      'header',
      'headWrp'
    );
  }

  /**
   *
   * @param {Node|Element|HTMLElement} ele
   */
  wrapBody(ele) {
    QuestCont.#wrapper(
      ele,
      QuestCont.#bodyWrpCls,
      'body',
      'bodyWrp'
    );
  }
}

// Format
//  info
//   header (if any)
//   subinfo
//   subinfoN...
class InfoCont {
  static #infoCls = 'cont-type-info';
  static #subCls = 'cont-type-sub';
  static #headCls = 'cont-type-head';
  static #dataCls = 'cont-type-data';
  static #bodyCls = 'cont-type-body';
  static #closeCls = 'cont-status-close';
  /**
   * @private
   * @type {Element|HTMLElement}
   */
  #InfoEle;
  /**
   *
   * @param {any|Element|HTMLElement} obj
   * @returns {Element}
   */
  static #isInfo(obj) {
    return isEle(obj) && obj.classList.contains(InfoCont.#infoCls)
      ? obj
      : null;
  }

  /**
   *
   * @param {any|InfoCont} obj
   * @returns {Element}
   */
  static #isInfoObj(obj) {
    return obj instanceof InfoCont
      ? obj.getInfo
      : null;
  }

  /**
   *
   * @param {{id:String, select:String}} identf use "id" for getElementById or "select" for querySelector
   * @returns {undefined|boolean}
   */
  static isOpen(identf) {
    const infoEle = isObj(identf)
      ? ('id' in identf
          ? document.getElementById(identf.id)
          : document.querySelector(Object.values(identf)[0]))
      : null;
    if (!infoEle) return;
    const isInfo = infoEle.classList.contains(InfoCont.#infoCls);
    if (isInfo && !(infoEle.classList.contains(InfoCont.#closeCls))) return true;
    let isOpen = true;
    const infoPars = new ParentE(
      infoEle,
      ele => !(ele.classList.contains(InfoCont.#infoCls)),
      true
    );
    for (const infoPar of infoPars) {
      if (!(infoPar.classList.contains(InfoCont.#closeCls))) continue;
      isOpen = false;
      break;
    }
    return isOpen;
  }

  /**
   * Refers only to headers
   * @param {Element|HTMLElement} ele element that is an info container
   * @param {String} cls class
   * @returns {[Element]}
   */
  static getOpen(ele, cls = InfoCont.#headCls) {
    const opened = [];
    const infoEle = InfoCont.#isInfo(ele);
    if (!infoEle || infoEle.classList.contains(InfoCont.#closeCls)) return opened;
    const headers = infoEle.getElementsByClassName(cls);
    if (headers.length === 0) return opened;
    for (const header of headers) {
      const headParents = new ParentE(
        header,
        ele => ele !== infoEle
      );
      let closedHead = false;
      for (const headParent of headParents) {
        if (headParent.classList.contains(InfoCont.#closeCls)) {
          closedHead = true;
          break;
        }
      }
      if (!closedHead) opened.push(header);
    }
    return opened;
  }

  /**
   *
   * @param {[Element|HTMLElement]} dataEles Array-like of data elements (inside of "body" elements)
   */
  static updateInfos(dataEles) {
    if (!('length' in dataEles) || dataEles.length === 0) return;
    if (!Array.isArray(dataEles)) {
      dataEles = Array.from(dataEles);
    }

    const subInfos = new Set();
    for (const dataEle of dataEles) {
      const dataPars = new ParentE(
        dataEle,
        ele => !!ele
      );
      for (const dataPar of dataPars) {
        if (!(dataPar.classList.contains(InfoCont.#subCls))) continue;
        subInfos.add(dataPar);
        break;
      }
      dataEle.remove();
    }

    if (subInfos.size === 0) return;

    function updateInfo(cont) {
      let ifClose = true;
      const isInfo = cont.classList.contains(InfoCont.#infoCls);
      if (isInfo && cont.classList.contains(InfoCont.#closeCls)) return ifClose;
      const contChs = Array.from(cont.children);
      for (const contCh of contChs) {
        const classL = contCh.classList;
        if (classL.contains(InfoCont.#closeCls)) {
          ifClose = ifClose && true;
        } else if (classL.contains(InfoCont.#dataCls)) {
          const dataBody = classL.contains(InfoCont.#bodyCls)
            ? contCh
            : contCh.getElementsByClassName(InfoCont.#bodyCls)[0];
          if (dataBody && dataBody.firstElementChild) {
            ifClose = ifClose && false;
          } else {
            contCh.remove();
            ifClose = ifClose && true;
          }
        } else if (classL.contains(InfoCont.#subCls)) {
          ifClose = ifClose && updateInfo(contCh);
        } else {
          ifClose = ifClose && true;
        }
      }
      if (ifClose) {
        cont.classList.add(InfoCont.#closeCls);
      };
      return ifClose;
    }

    const procdInfo = new Set();
    for (const subInfo of subInfos) {
      const bodyParents = new ParentE(
        subInfo,
        ele => !!ele
      );
      let infoCont;
      for (const bodyP of bodyParents) {
        if (!(bodyP.classList.contains(InfoCont.#infoCls))) continue;
        infoCont = bodyP;
        break;
      }
      if (!infoCont || procdInfo.has(infoCont)) continue;
      updateInfo(infoCont);
      procdInfo.add(infoCont);
    }
  }

  /**
   * if there is existing child element in subinfo, it will be remove automatically
   * @param {{id:String, any:String}} identf if key is "id", getElementById method will be use otherise querySelector method will be use
   * @param {Element|HTMLElement} dataCont data container
   * @param {Element|HTMLElement} bodyCont the element where its children element are the data itself, this is needed so updateStat will work
   * @param {Element|HTMLElement|InfoCont|null} infoEle
   */
  static insertData(identf, dataCont, bodyCont, infoEle = null) {
    if (!(dataCont && bodyCont)) {
      dataCont = bodyCont = dataCont || bodyCont;
    }

    if (!isObj(identf)) {
      throw new Error('Identifier should an object');
    }

    infoEle = InfoCont.#isInfo(infoEle) || InfoCont.#isInfoObj(infoEle);

    const subInfo = 'id' in identf
      ? document.getElementById(identf.id)
      : isEle(infoEle)
        ? infoEle.querySelector(Object.values(identf)[0])
        : null;
    if (!subInfo) return;

    if (subInfo.firstElementChild) removeData(subInfo);
    dataCont.classList.add(InfoCont.#dataCls);
    bodyCont.classList.add(InfoCont.#bodyCls);
    subInfo.appendChild(dataCont);

    subInfo.classList.remove(InfoCont.#closeCls);

    const subParents = new ParentE(
      subInfo,
      ele => ele.classList.contains(InfoCont.#closeCls)
    );
    for (const subParent of subParents) {
      subParent.classList.remove(InfoCont.#closeCls);
    }
  }

  /**
   *
   * @param {Element|HTMLElement|{str:String|[String]}} obj info element or object containing the attributes when creating new info element
   * @param  {InfoCont|Element|HTMLElement|{str:String|[String]}} subArgs InfoCont object or info element that will converted to subinfo for info element | attributes for subinfo
   */
  constructor(obj, ...subArgs) {
    this.#InfoEle = InfoCont.#isInfo(obj);
    if (!this.getInfo) {
      this.#InfoEle = createEle('div', null, InfoCont.#infoCls);
      if (isObj(obj)) setAttrs(this.getInfo, obj, true);
    }
    let fClose = true;

    if (subArgs.length !== 0) {
      for (const subArg of subArgs) {
        const info = InfoCont.#isInfo(subArg) || InfoCont.#isInfoObj(subArg);
        if (info) {
          fClose = info.classList.contains(InfoCont.#closeCls);
          this.appendInfo(info, true);
        } else {
          const subInfo = createEle('div', null, [InfoCont.#subCls, InfoCont.#closeCls]);
          if (isObj(subArg)) setAttrs(subInfo, subArg, true);
          this.getInfo.appendChild(subInfo);
        }
      }
    }
    if (fClose && !(this.getInfo.classList.contains(InfoCont.#closeCls))) {
      this.getInfo.classList.add(InfoCont.#closeCls);
    }
  }

  /**
   * @param {Element|HTMLElement} getInfo
   */
  get getInfo() {
    return this.#InfoEle;
  }

  /**
   *
   * @param {InfoCont|Element|HTMLElement} obj
   */
  appendInfo(obj, silent = false) {
    const info = !silent
      ? InfoCont.#isInfo(obj) || InfoCont.#isInfoObj(obj)
      : obj;
    if (info === null) return this;
    info.classList.replace(InfoCont.#infoCls, InfoCont.#subCls);
    this.getInfo.appendChild(info);
    return this;
  }

  /**
   * @param {Element|String} inner to be inserted in header element
   * @param {{str:String|[String]}} obj attributes for header element
   */
  addHeader(inner, obj) {
    const headerEle = createEle('div', inner, InfoCont.#headCls);
    if (isObj(obj)) setAttrs(headerEle, obj, true);
    this.getInfo.prepend(headerEle);
  }

  /**
   * if there is existing child element in subinfo, it will be remove automatically
   * @param {{id:String, any:String}} identf if key is "id", getElementById method will be use otherise querySelector method will be use
   * @param {Element|HTMLElement} dataCont data container
   * @param {Element|HTMLElement} bodyCont the element where its children element are the data itself, this is needed so updateStat will work
   */
  insert(identf, dataCont, bodyCont) {
    InfoCont.insertData(identf, dataCont, bodyCont, this.getInfo);
  }
}

class Updater {
  /**
   *
   * @param {string|Node|Element|HTMLElement} contNm element object or element tag name for creation
   * @param {Object} filData key: filter | value: filter value
   * @param  {...any} crtElePar parameters for creating container note body if it a string
   * @returns {Element}
   */
  static #open(contNm, filData, ...crtElePar) {
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
    let bodyCont = null;
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
        bodyCont = createEle(contNm, ...crtElePar);
      } else {
        bodyCont = createEle(contNm);
      }
    } else if (contNm.nodeType !== Node.ELEMENT_NODE) {
      console.trace();
      throw new Error('The container is not an Element');
    } else {
      bodyCont = contNm;
    }
    bodyCont.dataset.fil = (entFilData !== null) ? entFilData.map(filD => filD.join(':')).join('-') : '';
    bodyCont.dataset.conttype = 'body';
    return bodyCont;
  }
}
