// test: https://jsfiddle.net/e1aLbgv7/
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
          if (!notInc.includes(basisParse[idx])) parsedInfo[basisParse[idx]] = infoVal;
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
    if (this.eles.length !== this.procd.length) {
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
