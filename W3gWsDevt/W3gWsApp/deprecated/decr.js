//use object to retain some information in memory: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#getting_data_into_and_out_of_an_event_listener
//use .currentTarget
let mLvlAdMenu = {'Missable':'qwt-table', 'Enemies':'enm-table'}

function openMLvlnote(evt) {//opening Missable and Enemies Notes
  let addtlMenu = evt.currentTarget;
  let openedTable = addtlMenu.parentElement.querySelector('table[style="display: unset;"]'); //null is returned if there are no matches
  let noteTable = addtlMenu.parentElement.getElementsByClassName(mLvlAdMenu[addtlMenu.innerHTML])[0];
  if (openedTable === noteTable) {
    openedTable.removeAttribute('style');
  } else {
    if (openedTable) {
      openedTable.removeAttribute('style');
    }
    noteTable.style.display = 'unset';
  }
}

function levelAddltData(mData, mDataHeader, mDataCK, mTableClass) {
  /*
  data parameter structure:
    1. mData = questItem
    2. mDataHeader = th : array
    3. mDataCK = contains classnames and key names : array with object/s type
     3.1. for object: {classname:key name} or {classname:[key name...]}
    4. mDataUrlCl = classname of name and url, for null checking of url
  */
  let innerSect = document.createElement('table');
  innerSect.className = mTableClass;
  let innerSectRow = document.createElement('tr');
  for(let colHeader of mDataHeader) {
    let rowDataElmt = document.createElement('th');
    rowDataElmt.className = 'lvladdtl-notes';
    rowDataElmt.appendChild(document.createTextNode(colHeader));
    innerSectRow.appendChild(rowDataElmt);
  }
  innerSect.appendChild(innerSectRow); //header
  for(let mQdataRow of mData) { //questItem = [row1, row2, row3...], mQdataRow = row1/row2... = object
    innerSectRow = document.createElement('tr');
    innerSectRow.className = 'lvladdtl-row';
    let mQdataInfos = [] //to make sure it is ordered
    for(let ckInfo of mDataCK) {
      let cInfo = Object.keys(ckInfo)[0]; //class name
      let kInfo = ckInfo[cInfo]; //key/s
      let kValue;
      if(Array.isArray(kInfo)) {
        kValue = [];
        for(let kname of kInfo) {
          kValue.push(mQdataRow[kname]);
       }
      } else {
         kValue = mQdataRow[kInfo];
        }
      let tdInfo = {};
      tdInfo[cInfo] = kValue;
      mQdataInfos.push(tdInfo);
    }
    for(let mQdataInfo of mQdataInfos) {
      let rowDataElmt = document.createElement('td');
      let rowDataClass = Object.keys(mQdataInfo)[0];
      let rowData = mQdataInfo[rowDataClass];
      let rowDataName = (Array.isArray(rowData)) ? rowData[0] : null
      let rowDataUrl = (Array.isArray(rowData)) ? rowData[1] : null
      rowDataElmt.className = rowDataClass; //using the key as class name
      let rowDatatd;
      if(rowDataName && rowDataUrl) {
        rowDatatd = createUrl(rowDataUrl, rowDataName);
      } else {
        rowDatatd = document.createTextNode((rowDataName ? rowDataName : rowData));
      }
      rowDataElmt.appendChild(rowDatatd);
      innerSectRow.appendChild(rowDataElmt);
    }
    innerSect.appendChild(innerSectRow); //tr element
  }
  return innerSect
}

async function displayAffected(evt) {//event listerner and displaying affected data
  let kcData = notesData[this.noteName];
  let dataAffected = await queryInfo(kcData.queryUrl(this.dataId));
  let affectedList = document.createElement('ul');
  for (let affectedInfo of dataAffected) {
    let affectedQuest = affectedInfo['info'];
    affectedList.appendChild(displayLevelData([createUrl(affectedQuest['quest_url'], affectedQuest['quest_name']),
                                               affectedQuest['r_level'], affectedInfo['cut'], false, false],
                                               affectedQuest, document.createElement('li')))
  }
  questSect.appendChild(affectedList);
}

function displayLevelData(questList, mainData, sectElement) {
  let itemCount = 1;
  let cutoffType = questList[2]; //check if quest data has affected quests
  let addtlSect = document.createElement('div');
  for(let questItem of questList) {
    let sectItem = document.createElement('span');
    if(itemCount === 1) {//Quest Url
      sectItem.className = 'mQuest-Data';
      sectItem.appendChild(questItem);
    } else if (itemCount === 2) {//Quest Level
      sectItem.className = 'mQuest-level';
      sectItem.appendChild(document.createTextNode(questItem));
    } else if (itemCount === 3  && questItem) {//affected quest/s menu
      sectItem.className = 'mLvlAddtl-menu';
      sectItem.addEventListener('click', displayAffected.bind(mainData))
      sectItem.appendChild(document.createTextNode('Affected'));
    } else if (itemCount === 4 && questItem) { //Qwent info
        sectItem.className = 'mLvlAddtl-menu';
        sectItem.innerHTML = 'Missable';
        // sectItem.addEventListener('click', openMLvlnote);
        // let addNote = levelAddltData(questItem, ['Player Name', 'Player Location', 'Notes'],
        //                          [{'qwt-playername':['p_name', 'p_url']},
        //                           {'qwt-location':'p_location'},
        //                           {'qwt-notes': 'qwent_notes'}], 'qwt-table');
        // addtlSect.appendChild(addNote); //div element
    } else if (itemCount === 5 && questItem) { //Enemies info
        sectItem.className = 'mLvlAddtl-menu';
        sectItem.innerHTML = 'Enemies';
        // sectItem.addEventListener('click', openMLvlnote);
        // let addNote = levelAddltData(questItem, ['Enemy Name', 'Notes'],
        //                          [{'enm-name':['enemy_name', 'enemy_url']},
        //                           {'enm-notes': 'enemy_notes'}], 'enm-table');
        // addtlSect.appendChild(addNote); //div element
    }
    if (sectItem.hasChildNodes()) {
      if (cutoffType) {
        sectItem.classList.add('cutoff-quest');
      } else {
        sectItem.classList.add('normal-quest');
      }
      sectElement.appendChild(sectItem);
    }
    itemCount++;
  }
  if (addtlSect.hasChildNodes()) {
    sectElement.appendChild(addtlSect);
  }
  return sectElement
}
