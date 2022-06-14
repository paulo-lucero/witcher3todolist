// this will contain the event listeners for updating containers and counters
// for containers that don't display multi-region quests when updating, check if quest is multi-region, if yes check if already updated
// for infoRegion check if infoRegion is opened,
//   use logging: to log the any uninserted data
//     client send the log data on server, then the server parsed it and save it in a file
//     need to log: parsed quest data, parsed quests data inside of containers, sortBasis, ascS

// cutoff
contsM.addContUpdater(
  function(rlts) {
    let contsData = new EleData('[data-cont*=cutoff]');
    if (contsData.parsed.length === 0) return;

    let multiProcd = [];
    for (let rlt of rlts) {
      if (multiProcd.includes(rlt.id) || rlt.cutoff === null) continue;
      let cutoffConts = contsData.getEleAll('cutoff', rlt.cutoff);
      if (cutoffConts === null) continue;
      for (let cutoffCont of cutoffConts) {
        let cutOffData = genQueryData(rlt, document.createElement('li'), 5, null, true);
        insertData(cutOffData, cutoffCont, 'level');
      }
      if (rlt.ismulti) multiProcd.push(rlt.id);
    }
  }
);

// multi region quests
contsM.addContUpdater(
  function(rlts) {
    let contsData = new EleData('[data-cont*=quest]');
    if (contsData.parsed.length === 0) return;

    for (let rlt of rlts) {
      let multiConts = contsData.getEleAll('quest', rlt.id);
      if (multiConts === null) continue;
      for (let multiCont of multiConts) {
        let multiData = genQueryData(rlt, document.createElement('div'), 2);
        insertData(multiData, multiCont, 'level');
      }
    }
  }
);

// crucial and region
contsM.addContUpdater(
  function(rlts) {
    let infoData = infoQuestBody.dataset.cont;
    if (infoData.includes('level')) {
      let multiProcd = [];
      let hRiskBasis = infoSect.recentLvl - 5;
      let lRiskBasis = infoSect.recentLvl - 2;

      for (let rlt of rlts) {
        if (multiProcd.includes(rlt.id) || rlt.req_level > infoSect.recentLvl) continue;

        let crucData = genQueryData(rlt, document.createElement('div'), 5, null, true);
        let questLevel = rlt.req_level;
        let questCate = rlt.category_id;
        let cateIndx = questCate === 4 ? 0 : infoSect.cateIndx[questCate];
        let typeData = questCate === 4 ? 0
                     : questLevel === hRiskBasis ? 1
                     : questLevel <= lRiskBasis && questLevel > hRiskBasis ? 2
                     : questLevel < hRiskBasis ? 3
                     : null;
        if (typeData !== null) {
          insertData(crucData, infoSect.cateConts[typeData][cateIndx], 'level');
        }

        if (rlt.ismulti) multiProcd.push(rlt.id);
      }
    } else if (infoData.includes('region')) {
      for (let rlt of rlts) {
        let curRegion = parseData(infoQuestBody)[0].region;
        if (rlt.region_id !== curRegion || rlt.category_id === 1) continue;
        let questData = genQueryData(rlt, document.createElement('div'), 5);
        insertData(questData, infoSect.infoRegion, 'level');
      }
    }
  }
);

// main and secondary
contsM.addContUpdater(
  function(rlts) {
    let contData = new EleData('[data-cont*=main], #qsect-body [data-cont*=region]');
    let mainCont = contData.getEle('main', null);

    for (let rlt of rlts) {
      if (mainCont !== null && rlt.category_id === 1) {
        let mainQuest = genQueryData(rlt, document.createElement('div'), null, true);
        insertData(mainQuest, mainCont, 'questId');
      } else if (mainCont === null && rlt.category_id !== 1) {
        let regionCont = contData.getEle('region', rlt.region_id);
        if (regionCont === null) continue;
        let secQuest = genQueryData(rlt, document.createElement('div'), 5);
        insertData(secQuest, regionCont, 'level');
      }
    }
  }
);

contsM.addContCloser(
  'rightsect',
  function(cont) {
    let closeCate = cateBody => !hasQuests(cateBody) && removeData(cateBody); // if have quests data, removeData will not be execute
    for (let idx = 0; idx < infoSect.cateConts.length; idx++) {
      infoSect.cateConts[idx].forEach(closeCate);
    }
    infoSect.infoRefresh();
  }
);
