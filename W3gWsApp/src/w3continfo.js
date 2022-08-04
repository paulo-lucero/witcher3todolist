import {
  createEle,
  getAllQuests,
  isEle,
  removeData,
  isEles,
  queryInfo,
  crucNoData,
  mainNoData,
  finishedNoData,
  isObj,
  setAttrs,
  rmvAttrs,
  ParentE
} from './w3gdefs';
import { parsedAll, EleData, parsedEle } from './w3parse';

// test: https://jsfiddle.net/q5ufvc32/
function insertData(qData, contEle, sortBasis, ascS = true) {
  isEle(contEle, 'This Container must be an element');
  isEle(qData, 'Quest data must be an element');

  const qParsed = parsedEle(qData);

  const qISort = qParsed[sortBasis];
  if (qISort === undefined) {
    throw new Error('Can\'t be undefined');
  }
  const allqData = getAllQuests(contEle);
  const dLength = allqData.length;

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

class QuestCont {
  static #mainCls = 'quest-cont-main';
  static #headCls = 'quest-cont-head';
  static #bodyCls = 'quest-cont-body';
  static #footCls = 'quest-cont-foot';
  static #headWrpCls = 'quest-wrap-head';
  static #bodyWrpCls = 'quest-wrap-body';
  static #footWrpCls = 'quest-wrap-foot';
  static #wrapper(ele, wrpCls, refThis, refWrp) {
    if (!isEle(ele)) return;
    const wrpEle = this[refWrp];
    let refEle;
    if (wrpEle) {
      wrpEle.classList.toggle(wrpCls);
      refEle = wrpEle;
    } else {
      refEle = this[refThis];
    }
    ele.classList.toggle(wrpCls);
    this[refWrp] = ele;
    const refPar = refEle.parentElement;
    ele.appendChild(refEle);
    refPar.appendChild(ele);
  }

  #mainEle;
  #headerEle;
  #bodyEle;
  #footEle;
  #headWrpEle;
  #bodyWrpEle;
  #footWrpEle;

  /**
   *
   * @param {Element|HTMLElement} ele
   * @returns {Boolean}
   */
  static isBody(ele) {
    if (!isEle(ele)) return false;

    return ele.classList.contains(QuestCont.#bodyCls);
  }

  /**
   * Container that doesn't need to persist
   * @param {Element|HTMLElement|null} obj
   * @param {{str:String|[String]}} mainAtr main element attribute: use array for mulitple values
   * @param {{str:String|[String]}} headAtr header element attribute: use array for mulitple values
   * @param {{str:String|[String]}} bodyAtr body element attribute: use array for mulitple values
   * @param {{str:String|[String]}} footAtr footer element attribute: use array for mulitple values
   */
  constructor(obj, mainAtr, headAtr, bodyAtr, footAtr) {
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
    const footCol = isCont &&= obj.getElementsByClassName(QuestCont.#footCls);
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
    this.#footEle = isCont
      ? (footCol.length !== 0
          ? footCol[0]
          : null)
      : createEle('div', null, QuestCont.#footCls);

    if (!isCont) {
      this.main.append(
        this.header,
        this.body,
        this.foot
      );
    }

    const headWrpCol = isCont &&= obj.getElementsByClassName(QuestCont.#headWrpCls);
    const bodyWrpCol = isCont &&= obj.getElementsByClassName(QuestCont.#bodyWrpCls);
    const footWrpCol = isCont &&= obj.getElementsByClassName(QuestCont.#footWrpCls);
    this.#headWrpEle = headWrpCol && headWrpCol.length !== 0
      ? headWrpCol[0]
      : null;
    this.#bodyWrpEle = bodyWrpCol && bodyWrpCol.length !== 0
      ? bodyWrpCol[0]
      : null;
    this.#footWrpEle = footWrpCol && footWrpCol.length !== 0
      ? footWrpCol[0]
      : null;

    isEles(
      [this.header, 'Header Container'],
      [this.body, 'Body Container'],
      [this.foot, 'Footer Container']);
    if (isObj(mainAtr)) setAttrs(this.main, mainAtr, true);
    if (isObj(headAtr)) setAttrs(this.header, headAtr, true);
    if (isObj(bodyAtr)) setAttrs(this.body, bodyAtr, true);
    if (isObj(footAtr)) setAttrs(this.foot, footAtr, true);
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

  get foot() {
    return this.#footEle;
  }

  get headWrp() {
    return this.#headWrpEle;
  }

  get bodyWrp() {
    return this.#bodyWrpEle;
  }

  get footWrp() {
    return this.#footWrpEle;
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

  setFooter(ele) {
    this.foot.appendChild(ele);
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

  wrapFoot(ele) {
    QuestCont.#wrapper(
      ele,
      QuestCont.#footWrpCls,
      'foot',
      'footWrp'
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

  static #updateInfo(cont) {
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
        ifClose = InfoCont.#updateInfo(contCh) && ifClose; // can't do `ifClose && updateInfo(contCh)`; if "ifClose" is false, updateInfo wont execute
      } else {
        ifClose = ifClose && true;
      }
    }
    if (ifClose) {
      cont.classList.add(InfoCont.#closeCls);
    }
    return ifClose;
  }

  /**
   * Container that needed to persist
   * @param {InfoCont|{id:String, select:String}} identf use "id" for getElementById or "select" for querySelector
   * @returns {undefined|boolean}
   */
  static isOpen(identf) {
    const infoEle = (InfoCont.#isInfoObj(identf) || InfoCont.#isInfo(identf)) || (
      isObj(identf)
        ? ('id' in identf
            ? document.getElementById(identf.id)
            : document.querySelector(Object.values(identf)[0]))
        : null
    );
    if (!infoEle) return;
    const isInfo = infoEle.classList.contains(InfoCont.#infoCls);
    if (isInfo && !(infoEle.classList.contains(InfoCont.#closeCls))) return true; // info
    if (infoEle.classList.contains(InfoCont.#closeCls)) return false; // subinfo
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
    if (infoEle && infoEle.classList.contains(InfoCont.#closeCls)) return opened;
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
   * @param {{add:{attr:String|[String]},rmv:{attr:null|[String]}}} identf for setting and removing attributes of a direct parent subinfo only
   */
  static removeData(dataEles, identf) {
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
        if (isObj(identf)) {
          if ('add' in identf) setAttrs(dataPar, identf.add);
          if ('rmv' in identf) rmvAttrs(dataPar, identf.rmv);
        }
        break;
      }
      dataEle.remove();
    }

    if (subInfos.size === 0) return;

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
      InfoCont.#updateInfo(infoCont);
      procdInfo.add(infoCont);
    }
  }

  /**
   * if there is existing child element in subinfo, it will be remove automatically
   * @param {{id:String,select:String,add:{attr:String|[String]},rmv:{attr:null|[String]}}} identf if key is "id", getElementById method will be use otherise querySelector method will be use
   * @param {Element|HTMLElement} dataCont data container
   * @param {Element|HTMLElement} bodyCont the element where its children element are the data itself, this is needed so updateStat will work
   * @param {Element|HTMLElement|InfoCont|null} infoEle
   */
  static insertData(identf, dataCont, bodyCont, infoEle = null, logMode = false) {
    if (!(dataCont && bodyCont)) {
      dataCont = bodyCont = dataCont || bodyCont;
    }

    if (!isObj(identf)) {
      throw new Error('Identifier should an object');
    }

    infoEle = InfoCont.#isInfo(infoEle) || InfoCont.#isInfoObj(infoEle);

    const subInfo = 'id' in identf
      ? document.getElementById(identf.id)
      : isEle(infoEle) && 'select' in identf
        ? infoEle.querySelector(identf.select)
        : null;

    if (logMode) console.log(document.getElementById(identf.id));
    if (!subInfo) return;

    if ('add' in identf) setAttrs(subInfo, identf.add);
    if ('rmv' in identf) rmvAttrs(subInfo, identf.rmv);

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
   * @param {{id:String,select:String}} identf identifier for sub info
   * @param {InfoCont|Element|HTMLElement|{id:String,select:String}} infoCont
   */
  static closeSubInfo(identf, infoCont) {
    if (!isObj(identf)) {
      throw new Error('Identifier should be an object');
    }
    if (!isObj(infoCont)) {
      throw new Error('Info Container should be an object');
    }
    const infoEle = InfoCont.#isInfo(infoCont) ||
      InfoCont.#isInfoObj(infoCont) || (!isEle(infoCont) &&
      'id' in infoCont
      ? document.getElementById(infoCont.id)
      : 'select' in infoCont
        ? document.querySelector(infoCont.select)
        : null);
    if (!infoEle || !infoEle.classList.contains(InfoCont.#infoCls)) return;

    const subInfo = 'id' in identf
      ? document.getElementById(identf.id)
      : 'select' in identf
        ? infoEle.querySelector(identf.select)
        : null;

    if (!subInfo || !subInfo.classList.contains(InfoCont.#subCls)) return;

    if (subInfo.firstElementChild === null) return;

    removeData(subInfo);

    InfoCont.#updateInfo(infoEle);
  }

  /**
   *
   * @param {Element|HTMLElement|{str:String|[String]}} obj info element or object containing the attributes when creating new info element
   * @param  {InfoCont|Element|HTMLElement|{str:String|[String]}} subArgs InfoCont object or info element that will converted to subinfo for info element | attributes for subinfo
   */
  constructor(obj, ...subArgs) {
    this.#InfoEle = InfoCont.#isInfo(obj);
    let newInfo = false;
    if (!this.getInfo) {
      this.#InfoEle = createEle('div', null, InfoCont.#infoCls);
      if (isObj(obj)) setAttrs(this.getInfo, obj, true);
      newInfo = true;
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
    if (newInfo && fClose) {
      this.getInfo.classList.add(InfoCont.#closeCls);
    }
  }

  /**
   * @param {Element|HTMLElement} getInfo
   */
  get getInfo() {
    return this.#InfoEle;
  }

  addSub(attrs) {
    const subInfo = createEle('div', null, [InfoCont.#subCls, InfoCont.#closeCls]);
    if (isObj(attrs)) setAttrs(subInfo, attrs, true);
    this.getInfo.appendChild(subInfo);
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
  insert(identf, dataCont, bodyCont, logMode = false) {
    InfoCont.insertData(identf, dataCont, bodyCont, this.getInfo, logMode);
  }

  /**
   *
   * @param {String} cls class name of the of the container
   */
  getOpenAll(cls = InfoCont.#headCls) {
    return InfoCont.getOpen(this.getInfo, cls);
  }

  /**
   *
   * @param {{id:String,select:String}} identf identifier for sub info
   */
  closeSub(identf) {
    InfoCont.closeSubInfo(identf, this.getInfo);
  }
}

function GenFetchInit(qrData, infoFil = null, contFil = null, othrFil = null, getInfo = false, note = null) {
  this.method = 'PATCH';
  this.headers = {
    'Content-Type': 'application/json'
  };
  this.body = JSON.stringify(
    {
      questData: qrData,
      filter: {
        info: infoFil,
        cont: contFil,
        othr: othrFil
      },
      done: !(getInfo || note) ? Updater.isDone : null,
      redo: !(getInfo || note) ? !Updater.isDone : null,
      query: getInfo,
      note
    }
  );
}

class Updater {
  static isDone = true;
  static selectOn = false;
  static removeCls = 'info-selected-remove';
  static #beforeFuncs = new Set();
  static #infoUpdater = new Set();
  static #contUpdater = new Set();
  static #othrUpdater = new Set();
  static #contFiltSpec = {
    main: null,
    second: null,
    category: [1, 2, 3, 4],
    region: [1, 2, 3, 4, 5, 6, 7],
    level: 'number',
    cruc: 'number',
    cutoff: 'number',
    quest: 'number'
  };

  static #infoFiltSpec = {
    undone: null,
    done: null,
    cutoff: 'number',
    quest: 'number',
    region: [1, 2, 3, 4, 5, 6, 7],
    second: null
  };

  static #othrFiltSpec = {
    sreg: [1, 2, 3, 4, 5, 6, 7],
    ave: null
  };

  /**
   *
   * @param {{str:String|Number|null}} filData
   * @param {{str:String|Number|null|[Number]}} filSpec
   * @returns {[[String, String|null|Number]]}
   */
  static #filtValidt(filData, filSpec) {
    const entFilData = Object.entries(filData);
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
    return entFilData;
  }

  /**
   *
   * @param {[Object]} filts
   * @param {Boolean} keysOnly
   */
  static #consoFilt(filts, keysOnly = false) {
    const filTypes = new Map();

    if (keysOnly) {
      return filts.map(
        filt => Object.keys(filt).join('')
      );
    }

    for (const filt of filts) {
      const strType = Object.keys(filt).join('-');
      if (!(filTypes.has(strType))) {
        filTypes.set(strType, Object.assign({}, filt));
        continue;
      }
      const cFilt = filTypes.get(strType);
      for (const [filtT, filtV] of Object.entries(filt)) {
        const cFiltV = cFilt[filtT];
        const isArrCV = Array.isArray(cFiltV);
        if (isArrCV && !(cFiltV.includes(filtV))) {
          cFiltV.push(filtV);
        } else if (!isArrCV && cFiltV !== filtV) {
          cFilt[filtT] = [cFiltV, filtV];
        }
      }
    }
    return Array.from(filTypes.values());
  }

  /**
   * filter basis for container type elements
   * @param {Element|HTMLElement|null} ele Element
   * @param {{str:String|Number|null}} filData key: filter | value: filter value
   */
  static genContFilt(ele, filData) {
    if (!isObj(filData)) return;
    const filtEntries = Updater.#filtValidt(
      filData,
      Updater.#contFiltSpec
    );
    const filt = (filtEntries !== null)
      ? filtEntries.map(filD => filD.join(':')).join('-')
      : '';
    if (isEle(ele)) {
      ele.dataset.contfilt = filt;
      return ele;
    } else {
      return {
        'data-contfilt': filt
      };
    }
  }

  /**
   * filter basis for quest info elements, for updating quest data
   * @param {Element|HTMLElement} ele Element
   * @param {{str:String|Number|null}} filData key: filter | value: filter value
   */
  static genInfoFilt(ele, filData) {
    isEle(ele, 'Container should be an element');
    if (!isObj(filData)) return;
    const filtEntries = Updater.#filtValidt(
      filData,
      Updater.#infoFiltSpec
    );
    ele.dataset.infofilt = (filtEntries !== null)
      ? filtEntries.map(filD => filD.join(':')).join('-')
      : '';
  }

  /**
   * filter basis for quest info elements, for updating quest data
   * @param {Element|HTMLElement|null} ele Element
   * @param {{str:String|Number|null}} filData key: filter | value: filter value
   */
  static genOthrFilt(ele, filData) {
    if (!isObj(filData)) return;
    const filtEntries = Updater.#filtValidt(
      filData,
      Updater.#othrFiltSpec
    );

    const filt = (filtEntries !== null)
      ? filtEntries.map(filtD => filtD.join(':')).join('-')
      : '';
    if (isEle(ele)) {
      ele.dataset.othrfilt = filt;
      return ele;
    } else {
      return {
        'data-othrfilt': filt
      };
    }
  }

  static addBeforeFunc(func) {
    if (typeof func !== 'function') return;
    Updater.#beforeFuncs.add(func);
  }

  /**
   *
   * @param {Function} func
   */
  static addInfoUpdater(func) {
    if (typeof func !== 'function') return;
    Updater.#infoUpdater.add(func);
  }

  /**
   * NOTES:
   *  - No duplicates except for multi containers
   *  - Force multi info if needed (turn "1" on data-info region part if multi)
   * @param {Function} func
   */
  static addContUpdater(func) {
    if (typeof func !== 'function') return;
    Updater.#contUpdater.add(func);
  }

  /**
   * keys are concatenated, values doesn't affect the WHERE clause, "Other" WHERE clause mostly based on the "changes" table
   * @param {Function} func
   * @returns
   */
  static addOthrUpdater(func) {
    if (typeof func !== 'function') return;
    Updater.#othrUpdater.add(func);
  }

  static async update(addtl) {
    Updater.#beforeFuncs.forEach(
      func => func(addtl)
    );
    // const logMode = true;
    // if (logMode) return;

    const infoEles = new EleData('[data-infofilt]');
    const contEles = new EleData('[data-contfilt]');
    const othrEles = new EleData('[data-othrfilt]');

    const infoFilt = Updater.#consoFilt(infoEles.parsed);
    const othrFilt = Updater.#consoFilt(othrEles.parsed, true);
    const contFilt = !(Updater.isDone)
      ? Updater.#consoFilt(contEles.parsed)
      : null;

    const selectedInfo = document.getElementsByClassName('quest-container info-selected');
    if (selectedInfo.length === 0) return;
    const parsedInfos = parsedAll(selectedInfo, 'level');
    if (Updater.isDone) {
      const doneDate = Date.now();
      parsedInfos.forEach(info => {
        info.doneDate = doneDate;
      });
    }

    const updResult = await queryInfo(
      '/query/request-modif',
      new GenFetchInit(
        parsedInfos,
        infoFilt,
        contFilt,
        othrFilt)
    );

    if (updResult.err_r) {
      // throw new Error(`${updResult.err_r.type}\n${JSON.stringify(updResult.err_r.basis)}\n${updResult.sql_cmd}`);
      throw new Error(`${JSON.stringify(updResult.err_r)}\n${updResult.sql_cmd}`);
    } else if (updResult.modified !== parsedInfos.length) {
      throw new Error(
        'Number of modified row and selected info aren\'t equal',
        {
          cause: {
            selected: selectedInfo,
            results: updResult.result
          }
        }
      );
    }
    // console.warn('This is experimental phase, no changes commited; \nQuery result is: \n%o\nLogging is ON', updResult);

    InfoCont.removeData(selectedInfo);
    InfoCont.removeData(
      document.getElementsByClassName(Updater.removeCls)
    );

    const resultInfo = updResult.result.info;
    const resultCont = updResult.result.cont;
    const resultOthr = updResult.result.othr;
    const updaterFuncs = [
      [
        resultInfo
          ? Updater.#infoUpdater
          : null,
        { parsed: infoEles, result: resultInfo, addtl }
      ],
      [
        resultCont
          ? Updater.#contUpdater
          : null,
        { parsed: contEles, result: resultCont, addtl }
      ],
      [
        resultOthr
          ? Updater.#othrUpdater
          : null,
        { parsed: othrEles, result: resultOthr, addtl }
      ]
    ];
    for (const [updrs, resultData] of updaterFuncs) {
      if (updrs === null) continue;
      updrs.forEach(updr => updr(resultData));
    }

    // if empty containers
    crucNoData();
    mainNoData();
    finishedNoData();
  }
}

export {
  InfoCont,
  Updater,
  QuestCont,
  insertData,
  GenFetchInit
};
