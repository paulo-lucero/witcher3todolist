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

for (let infoSub of infoSect.infoSubs) {
  for (let order = 1; order <= Object.keys(infoSect.cateIndx).length; order++) {
    let infoIsFirst = infoQuestBody.firstElementChild === infoSub;
    let infoIsLast = infoQuestBody.lastElementChild === infoSub;
    let cateCont = createEle('div', null, eleCls='info-body');
    cateCont.appendChild(createEle('div', null, eleCls=infoSect.cateCls));
    infoSub.appendChild(cateCont);
    if (infoIsFirst || infoIsLast) {
      if (infoIsLast) {
        infoSect.infoRegion = cateCont.firstElementChild;
      }
      break;
    } else {
      cateCont.insertBefore(createEle('div', infoSect.cateIndx[order][1]), cateCont.firstElementChild);
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