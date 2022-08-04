import { Updater, QuestCont, insertData } from './w3continfo';
import { IdRef, DataContxt } from './w3gcontxt';
import {
  genMenuMarker,
  genMarkerFilt,
  genMenuCut,
  toggleQuestType,
  FormattedQuest,
  consoQueryData,
  genQuestCont
} from './w3gquestdata';
import {
  isEle,
  getQuest,
  createEle,
  CgRightSect,
  CgOverlay,
  CgLSect,
  aveSideQ,
  getParent,
  setupOverlays,
  createLSect,
  createRightInfo
} from './w3gdefs';
import { genRegCountEle, buttonsMangr } from './w3gevtltnrs';
import { parsedEle } from './w3parse';

function toggleRemove(dataCont) {
  dataCont.classList.toggle(Updater.removeCls);
}

/**
 *
 * @param {Element|HTMLElement|Number} questInfo,
 * @param {Element|HTMLElement} contEle
 */
function hasDuplicate(questInfo, contEle) {
  const questID = isEle(questInfo)
    ? parsedEle(questInfo).questId
    : typeof questInfo === 'number'
      ? questInfo
      : null;
  if (typeof questID !== 'number') {
    throw new Error('1st arg should be an element with info-data or a number');
  }

  return !!getQuest(contEle, new RegExp(`^${questID}#`));
}

async function initGuide() {
  // =Functions called before updating=

  // processing multi
  Updater.addBeforeFunc(
    function(addtl) {
      const multiConts = document.getElementsByClassName('multi-contnr');
      // const logObjs = [];
      for (const multiCont of multiConts) {
        const unMarked = multiCont.querySelectorAll(
          '.sub-multi-info:not(.info-selected)'
        );

        let addtMarked;
        if (unMarked.length === 0) {
          addtMarked = getParent(multiCont, { class: 'multi-info' });
          if (addtMarked === undefined) {
            throw new Error('Multi Info can\'t be undefined');
          }
          addtMarked = document.querySelectorAll(
            `.multi-info[data-info="${addtMarked.dataset.info}"]`
          );
          addtMarked.forEach(toggleRemove);
        } else if (unMarked.length === 1) {
          addtMarked = unMarked;
          addtMarked.forEach(
            subMulti => toggleRemove(subMulti)
          );
        }
        // logObjs.push({ multiCont, unMarked, addtMarked });
      }
      // console.log('Multi Info:\n %O', logObjs);
    }
  );

  // =info updaters=

  // multi data
  Updater.addInfoUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any, addtl:{isSubMulti:boolean}}} reslt
     */
    function(reslt) {
      const multiMarkers = reslt.parsed;
      if (!multiMarkers.hasKeys(['done', 'quest']) && !multiMarkers.hasKeys(['undone', 'quest'])) return;
      for (const questInfo of reslt.result) {
        const multis = multiMarkers.getEleAll({ done: null, quest: questInfo.id });
        const dones = multiMarkers.getEleAll({ undone: null, quest: questInfo.id });
        if (!multis && !dones) continue;

        const markers = multis || dones;
        if (markers.length === 0) continue;

        for (const marker of markers) {
          if (!('quest_count' in questInfo)) break;
          const curQCount = parseInt(marker.querySelector(
            '[data-qcount]'
          ).dataset.qcount, 10);
          if (!curQCount || curQCount === questInfo.quest_count) break;

          const isMulti = questInfo.quest_count > 1;

          const innerMarker = marker.firstChild;
          const multiRefID = isMulti
            ? IdRef.getOtrFor(innerMarker).multi
            : IdRef.getIdRef(innerMarker);
          innerMarker.remove();
          const newMarker = genMenuMarker(questInfo, new IdRef(multiRefID, true));
          genMarkerFilt(marker, questInfo, true);
          marker.appendChild(newMarker);

          const multiInfo = getParent(marker, { class: 'multi-info' });
          if (multiInfo === undefined) {
            throw new Error('Multi Info can\'t be undefined');
          }
          multiInfo.dataset.info = `${questInfo.id}#${isMulti ? 1 : questInfo.region_id}#${questInfo.req_level}`;
        }
      }
    }
  );

  // cutoff data
  Updater.addInfoUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      if (!eleData.hasKeys('cutoff')) return;
      for (const questInfo of reslt.result) {
        const menuConts = eleData.getEleAll('cutoff', questInfo.id);
        if (!menuConts || menuConts.length === 0) continue;

        for (const menuCont of menuConts) {
          const cutData = questInfo.cut;

          const curCutCount = parseInt(
            menuCont.querySelector(
              '[data-cutcount]'
            ).dataset.cutcount,
            10
          );
          if (isNaN(curCutCount) || curCutCount === cutData) break;

          const innerM = menuCont.querySelector('[data-id]');
          const cutRefID = IdRef.getIdRef(innerM);
          const newCut = genMenuCut(questInfo, new IdRef(cutRefID, true));
          menuCont.replaceChild(newCut, menuCont.firstChild);

          // toggle/replace "cutoff quest" with "normal quest" if cutoff is 0 and vice versa
          if (cutData !== 0 && !(curCutCount === 0 && cutData > 0)) continue;
          const mainMenu = getParent(menuCont, { class: 'menu-cont' });
          if (mainMenu === undefined) {
            throw new Error('main menu container can\'t be undefined');
          }
          toggleQuestType(mainMenu, newCut);
        }
      }
    }
  );

  // =cont updaters=
  // no duplicates except for multi containers
  // force multi info if needed (turn "1" on data-info region part if multi)

  // the cont filter should on body

  // cutoff
  Updater.addContUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      if (!eleData.hasKeys('cutoff')) return;
      for (const questInfo of reslt.result) {
        const cutoffID = questInfo.cutoff;
        if (cutoffID === null) continue;
        const cutoffConts = eleData.getEleAll('cutoff', cutoffID);
        if (!cutoffConts || cutoffConts.length === 0) continue;

        for (const cutCont of cutoffConts) {
          if (hasDuplicate(questInfo.id, cutCont)) continue;

          const infoEle = getParent(cutCont, { class: 'quest-container' });

          if (infoEle === undefined) {
            throw new Error('Quest Container Not Found');
          }

          const cutMenu = infoEle.querySelector('.cut [data-cutcount]');
          const questID = parseInt(cutMenu.dataset.id, 10);

          const cutQuest = new FormattedQuest(
            'aff',
            cutMenu,
            questID
          );

          insertData(cutQuest.genQuestData(questInfo), cutCont, 'level');
        }
      }
    }
  );

  // secondary
  Updater.addContUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      if (!eleData.hasKeys(['second', 'region'])) return;
      for (const questInfo of reslt.result) {
        const resRegID = questInfo.region_id;
        if (resRegID === 1) continue;
        const regData = { second: null, region: resRegID };
        const regConts = eleData.getEleAll(regData);
        if (!regConts || regConts.length === 0) continue;

        for (const regCont of regConts) {
          if (regCont === CgRightSect.infoObj.getInfo) continue;
          const regSect = getParent(regCont, { class: 'region-sect' });

          if (regSect === undefined) {
            throw new Error('Region Sect Not Found');
          }

          const regMenu = regSect.querySelector('.region-menu');
          const regID = parseInt(regMenu.dataset.region, 10);

          const regQuest = new FormattedQuest(
            'sec',
            regMenu,
            regID
          );
          insertData(regQuest.genQuestData(questInfo), regCont, 'level');
        }
      }
    }
  );

  // main
  Updater.addContUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      let mainCont = eleData.getEleAll('main', null);
      if (!mainCont || mainCont.length === 0) return;

      mainCont = mainCont[0];
      const mainMenu = document.getElementById('lsect-menu-cont');
      const subID = IdRef.getIdRef(mainMenu);
      for (const questInfo of reslt.result) {
        const questCat = questInfo.category_id;
        if (questCat !== 1) continue;

        if (!QuestCont.isBody(mainCont)) {
          CgLSect.infoObj.closeSub({ id: subID });
          mainCont = genQuestCont(
            [
              null,
              null,
              Updater.genContFilt(null, { main: null })
            ]
          );

          CgLSect.infoObj.insert({ id: subID }, mainCont.main, mainCont.body);
          mainCont = mainCont.body;
        }

        const mainContxt = new DataContxt(mainMenu, 'main');

        const mainQuest = consoQueryData(
          createEle('div'),
          questInfo,
          mainContxt
        );
        insertData(mainQuest, mainCont, 'questId');
      }
    }
  );

  // crucial
  Updater.addContUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      const infoObj = CgRightSect.infoObj;
      const crucCont = eleData.getEleAll('cruc', CgRightSect.recentLvl);
      if (!crucCont || crucCont.length === 0 || infoObj.getInfo !== crucCont[0]) return;

      const hRisk = CgRightSect.recentLvl - 5;
      const lRisk = CgRightSect.recentLvl - CgRightSect.exclLvlR;
      const questConts = {};
      for (const questInfo of reslt.result) {
        const questLvl = questInfo.req_level;
        if (questLvl === null) continue;
        const questCat = questInfo.category_id;
        const crucType = questCat === 4
          ? 1
          : questLvl === hRisk
            ? 2
            : questLvl <= lRisk && questLvl > hRisk
              ? 3
              : questLvl < hRisk
                ? 4
                : null;
        if (crucType === null) continue;

        infoObj.closeSub({ id: CgRightSect.refs[0] });

        const subID = questCat === 4
          ? CgRightSect.refs[crucType]
          : CgRightSect.refs[crucType][CgRightSect.order(questCat)];

        if (!(subID in questConts)) {
          let contEle = document.getElementById(subID).firstElementChild;
          contEle = isEle(contEle)
            ? new QuestCont(contEle)
            : genQuestCont(null, 'cruc');
          questConts[subID] = contEle;
        }

        const qContObj = questConts[subID];
        if (hasDuplicate(questInfo.id, qContObj.body)) continue;

        insertData(
          new FormattedQuest('cruc', subID, CgRightSect.recentLvl)
            .genQuestData(questInfo),
          qContObj.body,
          'level'
        );
      }

      const contsData = Object.entries(questConts);
      if (contsData.length === 0) return;
      for (const [subID, questCont] of contsData) {
        if (questCont.main.parentElement !== null) continue;
        infoObj.insert(
          { id: subID },
          questCont.main,
          questCont.body
        );
      }
    }
  );

  // right-sec region
  Updater.addContUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      const infoObj = CgRightSect.infoObj;
      const infoEle = infoObj.getInfo;
      const subID = CgRightSect.refs[5];
      const curReg = CgOverlay.curRegID;
      const regCont = eleData.getEleAll({ second: null, region: curReg });
      if (!regCont || regCont.length === 0 || regCont.every(ele => ele !== infoEle)) return;

      let questCont = document.getElementById(subID).firstElementChild;
      questCont = (questCont && new QuestCont(questCont)) || genQuestCont(null, 'sec');
      for (const questInfo of reslt.result) {
        const questReg = questInfo.region_id;
        if (questReg !== curReg) continue;

        infoObj.closeSub({ id: CgRightSect.refs[0] });

        insertData(
          new FormattedQuest('reg', subID, curReg).genQuestData(questInfo),
          questCont.body,
          'level'
        );

        if (questCont.main.parentElement === null) {
          infoObj.insert({ id: subID }, questCont.main, questCont.body);
        }
      }
    }
  );

  // multi
  Updater.addContUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      if (!eleData.hasKeys('quest')) return;

      for (const questInfo of reslt.result) {
        const questID = questInfo.id;
        const multiConts = eleData.getEleAll('quest', questID);

        if (!multiConts || multiConts.length === 0) continue;

        for (const multiCont of multiConts) {
          const infoEle = getParent(multiCont, { class: 'quest-container' });

          if (infoEle === undefined) {
            throw new Error('Quest Container Not Found');
          }

          const multiMenu = infoEle.querySelector('.marker .mult-reg.info-marker');
          const multiQuest = new FormattedQuest(
            'multi',
            IdRef.getIdRef(multiMenu),
            questID
          );

          insertData(
            multiQuest.genQuestData(questInfo),
            multiCont,
            'regionId'
          );
        }
      }
    }
  );

  // count updater

  // region-sec
  Updater.addOthrUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      if (!eleData.hasKeys('sreg')) return;

      for (const regData of reslt.result.sreg) {
        const questCount = regData.side_count;
        const regID = regData.id;

        const regEles = eleData.getEleAll('sreg', regID);
        if (!regEles || regEles.length === 0) continue;

        for (const regEle of regEles) {
          regEle.parentElement.replaceChild(genRegCountEle(questCount, regID), regEle);
        }
      }
    }
  );

  // ave-counter
  Updater.addOthrUpdater(
    /**
     *
     * @param {{parsed:EleData, result:Any}} reslt
     */
    function(reslt) {
      const eleData = reslt.parsed;
      if (!eleData.hasKeys('ave')) return;
      const questCount = reslt.result.ave[0];

      const aveEles = eleData.getEleAll('ave', null);
      if (!aveEles || aveEles.length === 0) return;

      aveSideQ(questCount);
    }
  );

  setupOverlays();
  await createLSect();
  await createRightInfo();

  document.getElementById('quest-query-left').addEventListener('click', buttonsMangr);
}

initGuide();
