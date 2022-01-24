//as much as possible separate the javascript code from html
//e.g. use element.onclick = function; instead of onclick="javascript code"

const queryInput = document.querySelector('.quest-query input[type="number"]');
const levelSection = document.getElementById('levelsect');

// data structure [{mquest_data : {single sqlite3row}, mqwt_data : [multiple slite3row], menemy_data : [multiple slite3row]}]
// later:
//  use Event.currentTarget, then node sibling
//  use .removeattribute/.removeproperty, to remove inline style, e.g. .removeattribute("style") or .removeproperty("display:unset;")
//  when using .queryselector, check if false(null), if not then do the instruction

function createUrl(urlLink, urlName) {
  let aTag = document.createElement('a');
  aTag.href = urlLink;
  aTag.innerHTML = urlName;
  aTag.target = '_blank';
  return aTag
}

function levelAddltData(mData, mDataHeader, mDataCK, mTableClass) {
  /*
  data parameter structure:
    1. mData = mQuest
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
  for(let mQdataRow of mData) { //mQuest = [row1, row2, row3...], mQdataRow = row1/row2... = object
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

async function displayAffected(evt) {//event listerner and displaying affected data
  let questSect = evt.currentTarget.parentElement;
  let retAffected = await fetch(`/query/id-${this['id']}`);
  if (!retAffected.ok) {
    throw new Error(`HTTP error! status: ${retAffected.status}`);
  }
  let dataAffected = await retAffected.json()
  let affectedList = document.createElement('ul');
  for (let affectedInfo of dataAffected) {
    let affectedQuest = affectedInfo['affq_data'];
    let affectedUrl = createUrl(affectedQuest['quest_url'], affectedQuest['quest_name']);
    affectedList.appendChild(displayLevelData([affectedUrl, affectedQuest['r_level'], affectedInfo['cutoff_status'],
                                               false, false], affectedQuest, document.createElement('li')))
  }
  questSect.appendChild(affectedList);
}

function displayLevelData(mQuestList, mainData, sectElement) {
  let itemCount = 1;
  let cutoffType = mQuestList[2]; //check if quest data has affected quests
  let addtlSect = document.createElement('div');
  for(let mQuest of mQuestList) {
    let sectItem = document.createElement('span');
    if(itemCount === 1) {//Quest Url
      sectItem.className = 'mQuest-Data';
      sectItem.appendChild(mQuest);
    } else if (itemCount === 2) {//Quest Level
      sectItem.className = 'mQuest-level';
      sectItem.appendChild(document.createTextNode(mQuest));
    } else if (itemCount === 3  && mQuest) {//affected quest/s menu
      sectItem.className = 'mLvlAddtl-menu';
      sectItem.addEventListener('click', displayAffected.bind(mainData))
      sectItem.appendChild(document.createTextNode('Affected'));
    } else if (itemCount === 4 && mQuest) { //Qwent info
        sectItem.className = 'mLvlAddtl-menu';
        sectItem.innerHTML = 'Missable';
        sectItem.addEventListener('click', openMLvlnote);
        let addNote = levelAddltData(mQuest, ['Player Name', 'Player Location', 'Notes'],
                                 [{'qwt-playername':['p_name', 'p_url']},
                                  {'qwt-location':'p_location'},
                                  {'qwt-notes': 'qwent_notes'}], 'qwt-table');
        addtlSect.appendChild(addNote); //div element
    } else if (itemCount === 5 && mQuest) { //Enemies info
        sectItem.className = 'mLvlAddtl-menu';
        sectItem.innerHTML = 'Enemies';
        sectItem.addEventListener('click', openMLvlnote);
        let addNote = levelAddltData(mQuest, ['Enemy Name', 'Notes'],
                                 [{'enm-name':['enemy_name', 'enemy_url']},
                                  {'enm-notes': 'enemy_notes'}], 'enm-table');
        addtlSect.appendChild(addNote); //div element
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

async function getMissionInfo(queryValue) {
  let resMissionInfo = await fetch(`/query/level-${queryValue}`);
  if(!resMissionInfo.ok) {
    throw new Error(`HTTP error! status: ${resMissionInfo.status}`);
  }
  return resMissionInfo.json()
}

// -I don't know if this function needed to be async, maybe test later using settimeout()
// data structure [{mquest_data : {single sqlite3row}, mqwt_data : [multiple slite3row], menemy_data : [multiple slite3row]}]
function retMissionInfo(queryValue) {
 getMissionInfo(queryValue).then(dataMissionInfo => {
    console.log(dataMissionInfo)
    if (levelSection.hasChildNodes()) {
      while(levelSection.firstChild) {
        levelSection.removeChild(levelSection.firstChild)
      }
    }
    for (let dataMission of dataMissionInfo) {
      let sectData = document.createElement('div');
      let mQuestData = dataMission['mquest_data'];
      let mQuestUrl = createUrl(mQuestData['quest_url'], mQuestData['quest_name']);
      let mQuestLevel = mQuestData['r_level'];
      let mQuestQwent = ('mqwt_data' in dataMission) ? dataMission['mqwt_data'] : null
      let mQuestEnemy = ('menemy_data' in dataMission) ? dataMission['menemy_data'] : null
      levelSection.appendChild(displayLevelData([mQuestUrl, mQuestLevel, dataMission['mqaffected'],
                                                 mQuestQwent, mQuestEnemy], mQuestData, sectData));
    }
  }).catch(errorMissionInfo => {
    console.trace(errorMissionInfo)
  });
}

retMissionInfo(1)

function missionQuery(evt) {
  if(evt.key === 'Enter') {
    retMissionInfo(queryInput.value)
  }
}

queryInput.addEventListener('keyup', missionQuery);

//=Notes=
// -processing of risk of overleveling or leveled undone missions are to be done here
// -for adding eventlistener in every loop
//  -define a function outside of loop, so one reference will be made on all function made (good for memory)
// -in case: if wanted to change(e.g. display none) a certain element when an another element receive an event, use .querySelector()
//  -e.g. document.querySelector(div span[style:"display:block;"])
