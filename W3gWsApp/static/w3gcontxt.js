/* global
    isEle
*/

class IdRef {
  #eleID;

  static #checkID(idstr) {
    return !!document.getElementById(idstr);
  }

  static getTarg(recEle) {
    if (!('idFor' in recEle.dataset)) {
      throw new Error('Receiver Element doesn\'t has "id-for" reference');
    }
    return document.getElementById(recEle.dataset.idFor);
  }

  static getOtrFor(ele) {
    if (!('otrFor' in ele.dataset)) return null;
    const otrFors = ele.dataset.otrFor.split(';');
    const parsedOtrs = {};
    for (const otrFor of otrFors) {
      const splitdOtr = otrFor.split(':');
      if (splitdOtr.length === 1) {
        throw new Error('Only one data parsed, can\'t identified the key and value');
      }
      if (splitdOtr.length > 2) {
        throw new Error('Multiple Data parsed, can\'t identified the key and value');
      }
      parsedOtrs[splitdOtr[0]] = splitdOtr[1];
    }
    return parsedOtrs;
  }

  static setForFr(ele, recEle, othrName) {
    // if othrName is string, it will find the otr-for on the element
    // if othrName isn't string or id isn't on ele, it will do nothing
    isEle(ele, 'This is not an Element');
    isEle(recEle, 'This receiver is not an Element');
    if (typeof othrName === 'string') {
      const otrFor = IdRef.getOtrFor(ele)[othrName];
      recEle.dataset.idFor = otrFor;
    } else if (ele.id) {
      recEle.dataset.idFor = ele.id;
    }
  }

  static parseID(ele, pMode = 'id', strg = false) {
    // pMode = using keyname for otr-for, use string with "-" on beginning or string thats not a "id" or "for"
    isEle(ele, 'This is not an Element');
    const refType = pMode === 'id'
      ? ele.id
      : pMode === 'for'
        ? ele.dataset.idFor
        : IdRef.getOtrFor(ele)[pMode.replace('-', '')];
    if (!refType) {
      throw new Error('No ID or ID reference found on the element');
    }
    const idDiv = refType.match(/(?<=-#).*/)[0];
    if (strg) return idDiv;
    const idData = idDiv.split('-');
    return idData.length > 1 ? { main: idData[0], addtl: idData[1] } : { main: idData[0] };
  }

  constructor(genID) {
    if (IdRef.#checkID(genID)) {
      throw new Error(`This generated ID ${genID} is already existed`);
    }
    this.#eleID = genID;
  }

  get getId() {
    return this.#eleID;
  }

  get getRef() {
    return { 'data-id-for': this.getId };
  }

  getOtrRef(ele, otrName) {
    // pass null on ele parameter, if there is no element to parsed the otrFor
    if (ele !== null) isEle(ele, 'The receiver is not an element');
    const otrFor = `${otrName}:${this.getId}`;
    return {
      'data-otr-for': isEle(ele) && 'otrFor' in ele.dataset
        ? `${ele.dataset.otrFor};${otrFor}`
        : `${otrFor}`
    };
  }

  addFor(ele, targ) {
    isEle(ele, 'The receiver is not an element');
    isEle(targ, 'The target is not an element');
    ele.dataset.idFor = this.getId;
    targ.id = this.getId;
    return this.getId;
  }

  addOtrFor(ele, targ, otrName) {
    isEle(ele, 'The receiver is not an element');
    isEle(targ, 'The target is not an element');
    const otrFor = `${otrName}:${this.getId}`;
    ele.dataset.otrFor = 'otrFor' in ele.dataset ? `${ele.dataset.otrFor};${otrFor}` : `${otrFor}`;
    targ.id = this.getId;
    return otrName;
  }
}

class InfoContxt {
  #septr = '-';
  #idSymb = '#';

  static #charValidt(...strgs) {
    for (const strg of strgs) {
      if (strg.match(/[-#:;]/)) {
        throw new Error(`Found not allowed character like "#", "-", ":", ";" on this "${strg}" string`);
      }
    }
  }

  static getContxt(ele, pMode = 'id', silent = false) {
    // pMode = using keyname for otr-for, use string with "-" on beginning or string thats not a "id" or "for"
    isEle(ele, 'The receiver is not an element');
    const refType = pMode === 'id'
      ? ele.id
      : pMode === 'for'
        ? ele.dataset.idFor
        : IdRef.getOtrFor(ele)[pMode.replace('-', '')];
    if (!refType && !silent) {
      throw new Error('No ID or ID reference found on the element');
    }
    return refType ? refType.match(/.*(?=-#)/)[0] : '';
  }

  constructor(ele, ccont = '') {
    if (!(ccont.trim())) {
      throw new Error('Current Context can\'t be an empty or whitespace or newline');
    }
    InfoContxt.#charValidt(ccont);
    const lcont = InfoContxt.getContxt(ele, 'for', true);
    const arrContxt = [ccont];
    if (lcont) arrContxt.unshift(lcont);
    this.newContxt = arrContxt.join(this.#septr);
  }

  createId(idF = '', addtl = '') {
    if (typeof idF !== 'string') {
      idF = typeof idF === 'number'
        ? idF.toString(10)
        : 'toString' in idF
          ? idF.toString()
          : `${idF}`;
    }
    if (!(idF.trim())) {
      throw new Error('ID can\'t be an empty or whitespace or newline');
    }
    InfoContxt.#charValidt(idF, addtl);
    let genID = this.newContxt + this.#septr + this.#idSymb + idF;
    genID = addtl.trim() ? genID + this.#septr + addtl : genID;
    return new IdRef(genID);
  }
}
