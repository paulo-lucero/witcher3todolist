async function displayAffected(evt) {
  if (allowEvt()) {
    let sect = evt.currentTarget.parentElement.parentElement;
    let noteContCls = 'affected-note';
    let sameNote = closeNotes(sect.querySelector('ul'), sect.getElementsByClassName(noteContCls)[0]);
    if (!sameNote) {
      let dataNotes = await queryInfo(`/query/aff-id-${this}`);
      let noteUl = document.createElement('ul');
      noteUl.className = noteContCls;
      noteUl.appendChild(genNoteHeader(document.createElement('li'), 'span', 4)); // header
      for (let dataNote of dataNotes) {
        noteli = document.createElement('li');
        noteUl.appendChild(displayQueryData(dataNote, noteli, 5));
      }
      sect.appendChild(noteUl);
    }
  }
}

async function displayNote(evt) {
  if (allowEvt()) {
    let sameNote = closeNotes(noteConts.nData.querySelector('ul'), noteConts.nData.getElementsByClassName(this.noteClass)[0],
                              menuContainer=(noteConts.nData.hasChildNodes()) ? evt.currentTarget.parentElement : null);
    if (!sameNote) {
      let dataNotes = await queryInfo(this.queryUrl(this.dataId));
      let noteUl = document.createElement('ul');
      noteUl.className = this.noteClass;
      noteUl.appendChild(genNoteHeader(document.createElement('li'), 'span', this.noteHeaders)); // header
      for (let dataNote of dataNotes) {
        noteli = document.createElement('li');
        for (let [dataClass, dataKey] of this.noteItems) {
          let noteSpan = document.createElement('span');
          noteSpan.className = dataClass;
          if (Array.isArray(dataKey)) {//processing url data
            noteSpan.appendChild(createUrl(dataNote[dataKey[0]], dataNote[dataKey[1]]));
          } else {
            noteSpan.appendChild(document.createTextNode(dataNote[dataKey]));
          }
          noteli.appendChild(noteSpan);
        }
        noteUl.appendChild(noteli);
      }
      noteConts.nData.appendChild(noteUl);
    }
  }
}

function showNotesOverlay(evt) {
  if (allowEvt()) {
    for (let headerNote of this.headers) {
      if (headerNote) {
        let headerEle = document.createElement('span');
        headerEle.appendChild(headerNote);
        noteConts.nHeader.appendChild(headerEle);
      }
    }
    for (let [notesName, notesBool] of this.notes) {
      if (notesBool) {
        let kcData = notesData[notesName];
        let noteMenu = document.createElement('span');
        noteMenu.className = kcData.menuClass;
        noteMenu.innerHTML = notesName;
        kcData.dataId = this.dataId;
        noteMenu.addEventListener('click', displayNote.bind(kcData));
        noteConts.nMenus.appendChild(noteMenu);
      }
    }
    noteConts.nMenus.firstChild.click();
    noteConts.overlayOn(true);
  }
}

function closeNotesOverlay(evt) {//closing overlay notes menu
  let openNotes = evt.target;
    //using "currentTarget", the target is always element with "qnotes-body" id, regardless where click event is dispatched
  if (openNotes.id === 'qnotes-body') {
    if (allowEvt('allow-select')) {
      removeData([noteConts.nHeader, noteConts.nData, noteConts.nMenus]);
      noteConts.overlayOn(false);
      markData.showDone(false);
    }
  }
}

function displayQueryData(consoInfos, sect, cutCol=null, isInclReg=null, custmCls=null) {
  let dataFuncs = [displayAffected, showNotesOverlay, questMarking, showMultiQuest, showDataConfirm];
  let questInfos = new finalData(consoInfos, isInclReg, Array.isArray(custmCls) ? custmCls : null, ...dataFuncs);
  let finalproct = typeof cutCol === 'number' ? questInfos.procdData.slice(0, cutCol) : questInfos.procdData;
  for (let questInfo of finalproct) {
    let sectEle = questInfo.menuCont;
    let questData = questInfo.menuName;
    if (questData !== null && questInfo.menuIsEvt && typeof questData !== 'object' || Array.isArray(questData)) {
      let dataCont = extdCreateEle(
        'span',
        Array.isArray(questData) ? questData : document.createTextNode(questData)
      );
      stylng(dataCont, 'width', 'revert');
      questData = dataCont;
    }
    let sectItem = extdCreateEle(sectEle, questData, ...questInfo.custmPar);
    if (questInfo.eventFunc) {
      let evtReceiver = questInfo.menuIsEvt ? questData : sectItem;
      evtReceiver.addEventListener('click', questInfo.eventFunc);
    }
    sect.appendChild(sectItem);
  }
  if (questInfos.multiBool) {
    sect.appendChild(extdCreateEle('div', null, 'multi-notes'));
  } else {
    sect.dataset.qstky = questInfos.questId;
    sect.dataset.regky = questInfos.regionId;
    sect.addEventListener('mouseenter', inputVisibility);
    sect.addEventListener('mouseleave', inputVisibility);
  }
  sect.className = 'quest-container';
  return sect;
}

async function showDataConfirm(evt) {
  if (allowEvt()) {
    if (this.show) {
      infoSect.regionId = this.regionId;
      if (infoSect.regionId !== this.regionId) {
        throw `Not same region id: info obj - ${infoSect.regionId} | region id - ${this.regionId}`;
      }
      for (let indx = 0; indx < infoSect.infoMenus.length - 1; indx++) {
        let openedNote = infoSect.cateConts[indx].some(cateBody => cateBody.hasChildNodes());
        if (openedNote) {
          infoSect.opnCrl.appendChild(extdCreateEle('div', infoSect.infoMenus[indx].innerHTML));
        }
      }
      if (infoSect.opnCrl.hasChildNodes()) {
        stylng(noteConts.w3, 'filter', 'blur(5px)');
        stylng(infoSect.conBody, 'display', 'flex');
      } else {
        infoSect.bttnConf.click();
      }
    } else {
      if (stylng(infoSect.conBody, 'display') !== 'none') {
        stylng(infoSect.conBody, 'display', 'none');
        stylng(noteConts.w3, 'filter', false);
      }
      if (this.confirm) {
        let questInfos = await queryInfo(`/query/second-quests-regid-${infoSect.regionId}`);
        infoSect.infoRefresh(true);
        if (questInfos === null) {
          infoSect.infoRegion.appendChild(retreiveNull());
        } else {
          infoSect.infoRegion.appendChild(genNoteHeader(document.createElement('div'), 'span', 4));
          for (let questInfo of questInfos) {
            infoSect.infoRegion.appendChild(displayQueryData(questInfo, document.createElement('div'), 5));
          }
        }
        infoSect.infoRefresh();
      }
      removeData(infoSect.opnCrl);
    }
  }
}

async function retreiveQuestData(evt) {
  if (allowEvt()) {
    let qNoteClass = this.qBodyClass;
    let checkSameNote = this.checkSameNote;
    let dataContainer = this.dataContainer;
    let sameNote = closeNotes([dataContainer], checkSameNote ? document.querySelector(`.${qNoteClass}`) : dataContainer.hasChildNodes(),
                              menuContainer = checkSameNote ? (dataContainer.hasChildNodes() ? pageQuestMenu : null) : null);

    if (!sameNote) {
      let questInfos = await queryInfo(this.urlQuery);
      dataContainer.className = qNoteClass;
      if (questInfos === null) {
        infoSect.infoRegion.appendChild(retreiveNull());
      } else {
        dataContainer.appendChild(genNoteHeader(document.createElement('div'), 'span', typeof this.colCut === 'number' ? this.colCut - 1 : null));
        for (let questInfo of questInfos) {
          dataContainer.appendChild(displayQueryData(questInfo, document.createElement('div'), this.colCut, this.isInclReg));
        }
      }
    }
  }
}

async function retreiveRegionData(evt) {
  if (allowEvt()) {
    let qNoteClass = this.qBodyClass;
    let sameNote = closeNotes([pageQuestBody], document.querySelector(`.${qNoteClass}`),
                              menuContainer = pageQuestBody.hasChildNodes() ? pageQuestMenu : null);
    if(!sameNote) {
      let regionInfos = await queryInfo(this.urlQuery);
      pageQuestBody.className = qNoteClass;
      for (let regionInfo of regionInfos) {
        let rBodyCls = 'region-body';
        let regionMenu = extdCreateEle('div', [
          extdCreateEle('span', regionInfo.region_name, eleCls='region-name'),
          extdCreateEle('span', regionInfo.quest_count, eleCls='quest-count')
        ], eleCls='region-menu');
        let regionBody = extdCreateEle('div', null, eleCls=rBodyCls);
        if (regionInfo.quest_count) {
          regionMenu.addEventListener('click', retreiveQuestData.bind({
            qBodyClass: rBodyCls,
            checkSameNote: false,
            dataContainer: regionBody,
            urlQuery: `/query/second-quests-regid-${regionInfo.id}`,
            colCut: 5,
            isInclReg: false
          }));
        }
        let regionSect = extdCreateEle('div', [regionMenu, regionBody], eleCls='region-sect');
        pageQuestBody.appendChild(regionSect);
      }
    }
  }
}

async function checkQuestsStatus() {
  if (allowEvt()) {
    let menusData = [
      [
        'main_count',
        'Main Quests',
        'qmain-menu',
        retreiveQuestData,
        {
          urlQuery: '/query/main-quests-info',
          qBodyClass: 'qmain-body',
          dataContainer: pageQuestBody,
          checkSameNote: true,
          colCut: null,
          isInclReg: true
        }
      ],
      [
        'second_count',
        'Second Quests',
        'qsec-menu',
        retreiveRegionData,
        {
          urlQuery: '/query/regions-info',
          qBodyClass: 'qsec-body',
        }
      ]
    ];
    let questsStatus = await queryInfo('/query/check-quests-info');
    if(!questsStatus) {
      pageQuestBody.appendChild(retreiveNull());
      return;
    }
    for (let [questCat, qMenuName, qMenuClass,menuFunc, bindData] of menusData) {
      if (questsStatus[questCat]) {
        let menuEle = extdCreateEle('span', qMenuName, eleCls=qMenuClass);
        menuEle.addEventListener('click', menuFunc.bind(bindData));
        pageQuestMenu.appendChild(menuEle);
      }
    }
    pageQuestMenu.firstChild.click();
  }
}

async function retreiveCrucialData(queryLevel) {
  function infoHeader(cateBody) {
    if (cateBody.hasChildNodes()) {
      cateBody.insertBefore(genNoteHeader(document.createElement('div'), 'span', 4), cateBody.firstElementChild);
    }
  }
  if (allowEvt()) {
    let qCrucialInfos = await queryInfo(`/query/crucial-quests-qrylvl-${queryLevel}`);
    infoSect.infoRefresh(true);
    if (qCrucialInfos) {
      let hRiskBasis = queryLevel - 5;
      let lRiskBasis = queryLevel - 2;
      for (let qCrucialInfo of qCrucialInfos) {
        let questLevel = qCrucialInfo.req_level;
        let questCate = qCrucialInfo.category_id;
        let cateIndx = questCate === 4 ? 0 : infoSect.cateIndx[questCate];
        let typeData = questCate === 4 ? 0
                     : questLevel === hRiskBasis ? 1
                     : questLevel <= lRiskBasis && questLevel > hRiskBasis ? 2
                     : questLevel < hRiskBasis ? 3
                     : null;
        if (typeData !== null) {
          infoSect.cateConts[typeData][cateIndx].appendChild(displayQueryData(qCrucialInfo, document.createElement('div'), 5));
        }
      }
    }
    for (let cateIndx in infoSect.cateConts) {
      infoSect.cateConts[cateIndx].forEach(infoHeader);
    }
    if (!infoSect.infoRefresh()) {
      infoSect.infoRegion.appendChild(extdCreateEle('div', `No Crucial Quests Data for level: ${queryLevel}`));
      undsplyEle([infoSect.infoRegion.parentElement, infoSect.infoRegion.parentElement.parentElement], true);
    }
  }
}

async function showMultiQuest(evt) {
  if (allowEvt()) {
    let questDataCont = evt.currentTarget.parentElement;
    let multiDataCont = questDataCont.querySelector('.multi-notes');
    sameNote = closeNotes([multiDataCont], multiDataCont.hasChildNodes());
    if (!sameNote) {
      let multiInfos = await queryInfo(`/query/qst-id-${this}`);
      for (let multiInfo of multiInfos) {
        let innerCont = document.createElement('div');
        let questLoc = extdCreateEle('span', `${multiInfo.location} :`, eleCls='multi-rname');
        multiDataCont.appendChild(displayQueryData(multiInfo, innerCont, 2));
        // console.log(innerCont.children[1]);
        innerCont.insertBefore(questLoc, innerCont.children[1]);
      }
    }
    undsplyEle([multiDataCont]);
  }
}

function inputLvlQuery(evt) {
  if (allowEvt()) {
    let curValue = inputData.inputEle.value;
    let indexExpt = curValue.search(/E|e/);
    let parsedValue = indexExpt !== -1 ? parseFloat(curValue.slice(0, indexExpt)) : parseFloat(curValue);
    inputData.inputEle.value = parsedValue > 0 ? Math.floor(parsedValue) : 1;
    let eleTarget = evt.currentTarget;
    let queryValue = parseInt(inputData.inputEle.value);
    if (eleTarget === inputData.arrowUp) {
      inputData.inputEle.value = queryValue = queryValue + 1;
    } else if (eleTarget === inputData.arrowDown) {
      inputData.inputEle.value = queryValue = queryValue - 1;
    } else if (evt.key !== 'Enter') {
      return;
    }
    retreiveCrucialData(queryValue);
  }
}

async function questMarking(evt) {
  if (allowEvt('allow-select')) {
    let questId = parseInt(evt.currentTarget.parentElement.dataset.qstky);
    let regionId = parseInt(evt.currentTarget.parentElement.dataset.regky);
    let qrId = [questId, regionId];
    let dataConts = Array.from(document.querySelectorAll(`[data-qstky=\"${questId}\"][data-regky=\"${regionId}\"]`));
    if (markData.selectOn) {
      dataConts.forEach(
        function(dataCont) {
          let isSelected = 'selected' in dataCont.dataset ? JSON.parse(dataCont.dataset.selected) : false;
          dataCont.dataset.selected = !isSelected;
          dataCont.querySelector('.quest-marker').checked = !isSelected;
        }
      );
      markData.selectRefrh();
    } else {
      qrId.push(Date.now());
      // IMPORTANT: the quest container selected attribute should be true, otherwise the ContainersManager.getMarked() will not able to get it
      let resultData = await queryInfo('/query/request-modif', new modifData(qrId));
      if (resultData.modified) {
        removeData(dataConts);
        undsplyEle(dataConts);
      }
    }
  }
}

async function showQuestsDone(evt) {
  if (allowEvt()) {
    if (evt.target === document.getElementById('done-display')) {
      markData.showDone(true);
      noteConts.overlayOn(true);
      document.getElementById('done-menu').firstElementChild.click();
    } else {
        let bttnsData = [
          {
            bttn: markData.recentBttn,
            mode: 'recent'
          },
          {
            bttn: markData.allBttn,
            mode: 'all'
          }
        ];
        let currCont = markData.doneDataCont;
        let isEmpty = !currCont.firstElementChild;
        let queryData = {};
        for (let bttnData of bttnsData) {
          if (evt.target === bttnData.bttn && (isEmpty || currCont.dataset.mode !== bttnData.mode)) {
            queryData[bttnData.mode] = Date.now();
            let doneData = await queryInfo('/query/request-modif', new modifData(null, queryData));
            if(!isEmpty) removeData(currCont);
            if (!doneData || doneData.length === 0) {
            currCont.appendChild(retreiveNull());
            return;
            }
            let currReg = null;
            for (let doneQuest of doneData) {
              if (!currReg || parseInt(currReg.dataset.regid, '10') !== doneQuest.region_id) {
                currReg = extdCreateEle('div', doneQuest.region_name, null, null, {'data-regid': doneQuest.region_id});
                currCont.appendChild(currReg);
              }
              currReg.appendChild(displayQueryData(doneQuest, document.createElement('div'), 2));
            }
            currCont.dataset.mode = bttnData.mode;
            break;
          }
        }
    }
  }
}

async function redoAllQuest(evt) {
  if (allowEvt()) {
    let resultData = await queryInfo('/query/request-modif', new modifData(null));
    if (resultData.modified) {
    }
    console.log(resultData.row_count);
  }
}

function inputVisibility(evt) {
  if (!markData.selectOn) {
    let questMarker = evt.target.querySelector('.quest-marker');
    let evtType = evt.type;
    if (evtType === 'mouseenter' && questMarker) {
      questMarker.style.setProperty('visibility', 'revert');
    } else if (evtType === 'mouseleave' && questMarker) {
      questMarker.style.setProperty('visibility', 'hidden');
    }
  }
}

async function selectMode(evt) {
  if (allowEvt('allow-select')) {
    let selectData = {
      selBttn: markData.doneMode ? markData.selectBttn : markData.doneSelect,
      canBttn: markData.doneMode ? markData.cancelBttn : markData.doneCancel,
      markMsg: markData.doneMode ? 'Done' : 'Undone',
      dataSect: markData.doneMode ? noteConts.w3 : markData.doneDataCont
    };
    selectData.selBttn.innerHTML = markData.selectOn ? 'Select Quest' : selectData.markMsg;
    if (markData.selectOn) {
      let dataConts = Array.from(selectData.dataSect.querySelectorAll('[data-selected=\"true\"]'));
      //add instruction for disable "mark as done" if there is no selected
      if (evt.target !== selectData.canBttn && markData.selectRefrh()) {
        let selectedQuest = uniqueQRid(
          dataConts.map(
            dataCont => [parseInt(dataCont.dataset.qstky), parseInt(dataCont.dataset.regky)]
          )
        );
        if (markData.doneMode) {
          let doneDate = Date.now();
          selectedQuest.forEach(qrData => qrData.push(doneDate));
        }
        let resultData = await queryInfo('/query/request-modif', new modifData(selectedQuest));
        if (resultData.modified) {
          removeData(dataConts);
          undsplyEle(dataConts);
        }
      } else if (evt.target === selectData.canBttn) {
          if (dataConts.length > 0) {
            dataConts.forEach(
              function(dataCont) {
                dataCont.querySelector('.quest-marker').checked = false;
              }
            );
          }
        }
      dataConts.forEach(dataCont => delete dataCont.dataset.selected);
    }
    markData.selectOn = !markData.selectOn;
    markData.selectRefrh();
    selectData.dataSect.classList.toggle('select-on');
    selectData.canBttn.style.setProperty('display', markData.selectOn ? 'inline-block' : 'none');
    //when selectOn change to false, all checked input should be unchecked
  }
}

inputData.inputEle.addEventListener('keyup', inputLvlQuery);
inputData.arrowUp.addEventListener('click', inputLvlQuery);
inputData.arrowDown.addEventListener('click', inputLvlQuery);

infoSect.bttnConf.addEventListener('click', showDataConfirm.bind({show:false, confirm:true}));
infoSect.bttnCanl.addEventListener('click', showDataConfirm.bind({show:false, confirm:false}));

noteConts.nBody.addEventListener('click', closeNotesOverlay);

markData.selectBttn.addEventListener('click', selectMode);
markData.cancelBttn.addEventListener('click', selectMode);
document.getElementById('done-display').addEventListener('click', showQuestsDone);
markData.doneSelect.addEventListener('click', selectMode);
markData.doneCancel.addEventListener('click', selectMode);
document.getElementById('undone-all').addEventListener('click', redoAllQuest);

markData.recentBttn.addEventListener('click', showQuestsDone);
markData.allBttn.addEventListener('click', showQuestsDone);

checkQuestsStatus();

// TODO:
//  -!!
//   -improve memory management?
//    -use a function that return the constant(functions, like inputData.inputEle, levelSection & etc)
//  -Problem:
//   -switching animation between missable and enemies notes aren't smooth
//    -possible cause: when the prev note is remove, the "space" which the prev note reside will also dissapper
//    -possible solution: this can be solve with animation
//   -memory usage seems do not decrease regardless of length of query result

//=Notes=
// -as much as possible separate the javascript code from html
//  -e.g. use element.onclick = function; instead of onclick="javascript code"
// -for adding eventlistener in every loop
//  -define a function outside of loop, so one reference will be made on all function made (good for memory)
// -in case: if wanted to change(e.g. display none) a certain element when an another element receive an event, use .querySelector()
//  -e.g. document.querySelector(div span[style:"display:block;"])
